import type { Language, TemplateKey, TemplateSettingsFile } from './templateSettings';
import createDOMPurify from 'dompurify';
import { descriptionAttributes } from './descriptionAttributes';

let settings: TemplateSettingsFile | null = null;
export function installTemplateCopy(file: TemplateSettingsFile | null) { settings = file; }
export function escapeCopy(value: string) {
    return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
export function templateCopy(key: TemplateKey, id: string, fallback: string) {
    const value = savedCopy(key, id);
    return value === undefined ? fallback : escapeCopy(value);
}
export function savedCopy(key: TemplateKey, id: string) {
    return settings?.templates[key]?.description.copy?.[id];
}
export type CopyLeaf = [number, number, string];
export function inheritedBlock(original: string, leaves: CopyLeaf[], edits?: Record<string,string>) {
    if (!edits) return original;
    let result = original;
    for (let i = leaves.length - 1; i >= 0; i--) {
        const [start,end,id] = leaves[i];
        if (edits[id] !== undefined) result = result.slice(0,start) + escapeCopy(edits[id]) + result.slice(end);
    }
    return result;
}
export function listingBlock(key: TemplateKey, id: string, original: string, leaves: CopyLeaf[]) {
    const edits = settings?.templates[key]?.description.copy;
    return edits?.[id] === undefined ? inheritedBlock(original, leaves, edits) : sanitizeInlineCopy(edits[id]);
}
export function isOptionHtml(html: string) {
    return /<[a-z][\w-]*[\s>]/i.test(html);
}

export function legacyPartKeys(edits: Record<string, string>, id: string) {
    return Object.keys(edits).filter(k => k.startsWith(id + ':część:'));
}

export function editableOptionHtml(html: string, id: string, edits: Record<string, string>) {
    if (edits[id] !== undefined) return edits[id];
    if (!legacyPartKeys(edits, id).length) return html;
    const container = document.createElement('template');
    container.innerHTML = html;
    const walker = document.createTreeWalker(container.content, NodeFilter.SHOW_TEXT);
    let i = 0;
    while (walker.nextNode()) {
        const text = walker.currentNode as Text;
        if (!text.data.trim() || text.parentElement?.closest('style,script,svg')) continue;
        const edit = edits[id + ':część:' + i++];
        if (edit !== undefined) text.data = text.data.replace(/\S[\s\S]*\S|\S/, () => edit);
    }
    return container.innerHTML;
}

let purifier: ReturnType<typeof createDOMPurify> | undefined;
export function sanitizeInlineCopy(html: string): string {
    purifier ??= createDOMPurify(window);
    return purifier.sanitize(html, {
        ALLOWED_TAGS: ['b','strong','i','em','u','br','sup','sub'], ALLOWED_ATTR: [],
        ALLOW_DATA_ATTR: false, ALLOW_ARIA_ATTR: false,
    });
}
export function sanitizeOptionHtml(html: string): string {
    purifier ??= createDOMPurify(window);
    return purifier.sanitize(html, {
        ALLOWED_TAGS: ['div','section','span','p','br','hr','h1','h2','h3','h4','h5','h6','ul','ol','li','dl','dt','dd','b','strong','i','em','u','small','sub','sup','img','a','table','thead','tbody','tr','th','td','blockquote'],
        ALLOWED_ATTR: ['class','src','alt','title','href','width','height','colspan','rowspan','start'],
        ALLOW_DATA_ATTR: false,
    });
}
export function optionDictionary<T extends Record<string, string>>(key: TemplateKey, language: Language, group: string, defaults: T): T {
    const entries = settings?.templates[key]?.description.copy;
    if (!entries) return defaults;
    const prefix = language + ':' + group + ':';
    const extra = descriptionAttributes[key]?.[group] ? Object.entries(entries)
        .filter(([id]) => id.startsWith(prefix) && !id.includes(':część:') && !Object.prototype.hasOwnProperty.call(defaults, id.slice(prefix.length)))
        .map(([id, value]) => [id.slice(prefix.length), escapeCopy(value)]) : [];
    return Object.fromEntries([...extra, ...Object.entries(defaults).map(([option, value]) => {
        const id = language + ':' + group + ':' + option;
        if (isOptionHtml(value)) return [option, entries[id] === undefined
            ? editableOptionHtml(value, id, entries) : sanitizeOptionHtml(entries[id])];
        return [option, templateCopy(key, id, value)];
    })]) as T;
}
