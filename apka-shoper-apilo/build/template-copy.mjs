import ts from 'typescript';
import { parseFragment } from 'parse5';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Only listing generators belong here, never UI labels or API dictionaries.
const sources = {
    pc: ['addPc.tsx', 'templates/pcTemplateNew.ts', 'templatesCZ/pcTemplateCZ.ts', 'templatesSK/pcTemplateSK.ts', 'templatesAllegro/wirelessCommunicationSection.ts'],
    gaming: ['addGamingPC.tsx', 'templates/gamingTemplate.ts', 'templatesCZ/gamingTemplateCZ.ts', 'templatesSK/gamingTemplateSK.ts'],
    monitor: ['addMonitor.tsx', 'templates/monitorTemplate.ts', 'templatesCZ/monitorTemplateCZ.ts', 'templatesSK/monitorTemplateSK.ts', 'templatesAllegro/monitorAllegroDescription.ts'],
    'laptop-new': ['addLaptopNew.tsx', 'templates/laptopTemplateNew.ts', 'templatesCZ/laptopTemplateCZ.ts', 'templatesSK/laptopTemplateSK.ts', 'templates/laptopTemplate-apilo.ts', 'templatesAllegro/allegroDescriptionTemplate.tsx', 'templatesAllegro/laptopAdditionalInfo.ts'],
    'damaged-laptop': ['addDamagedLaptop.tsx', 'templates/damagedLaptops.ts'],
    ios: ['addPhoneIOS.tsx', 'templates/iosTemplate.ts'],
    android: ['addPhoneAndroid.tsx', 'templates/androidTemplate.ts', 'templatesCZ/androidTemplateCZ.ts', 'templatesSK/androidTemplateSK.ts'],
};

const marker = '\uE000';
const quote = s => s.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${');
export function compileCopy(source, filename, key) {
    const file = ts.createSourceFile(filename, source, ts.ScriptTarget.Latest, true);
    const language = filename.includes('templatesCZ/') ? 'cz' : filename.includes('templatesSK/') ? 'sk' : 'pl';
    const entries = new Map();
    const edits = [];
    const inline = new Set();
    function markValue(node) {
        if (ts.isParenthesizedExpression(node)) markValue(node.expression);
        else if (ts.isConditionalExpression(node)) { markValue(node.whenTrue); markValue(node.whenFalse); }
        else if (ts.isTemplateExpression(node) || ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) inline.add(node);
    }
    function literal(tokens, node) {
        const parts = tokens.map(t => t.text);
        const html = parts.join(marker);
        if (!inline.has(node) && !/<[a-z][\w-]*[\s>]/i.test(html)) return;
        let owner = node.parent;
        while (owner && !(ts.isVariableDeclaration(owner) && ts.isArrowFunction(owner.initializer ?? file)) && !ts.isFunctionDeclaration(owner)) owner = owner.parent;
        const ownerName = owner?.name?.getText(file) ?? filename;
        // Keep existing office Allegro copy overrides after extracting the shared description builder.
        const section = filename === 'addPc.tsx' && ownerName === 'buildOfficeAllegroDescription' ? 'handleAddAllegroOffer' : ownerName;
        const channel = /allegro/i.test(filename + section) ? 'Allegro' : /apilo/i.test(filename + section) ? 'Apilo' : 'szablonu';
        const ranges = [];
        const blocks = [];
        const textId = original => language + ':tekst:' + createHash('sha256').update([filename,section,original.replace(/\s+/g,' ')].join('\n')).digest('hex').slice(0,24);
        function inlineNode(el) {
            const loc = el.sourceCodeLocation;
            if (!loc || html.slice(loc.startOffset, loc.endOffset).includes(marker)) return false;
            if (el.nodeName === '#text') return true;
            return ['b','strong','i','em','u','sup','sub','br'].includes(el.tagName) && !el.attrs.length &&
                (el.tagName === 'br' || !!loc.endTag) && el.childNodes.every(inlineNode);
        }
        function scan(el) {
            if (['style','script','svg','textarea','template'].includes(el.tagName)) return;
            if (el.nodeName === '#text' && el.sourceCodeLocation) {
                ranges.push(el.sourceCodeLocation);
            }
            let run = [];
            function flush() {
                if (run.some(c => c.tagName) && run.length > 1) {
                    const first = run[0].sourceCodeLocation.startOffset;
                    const raw = html.slice(first, run.at(-1).sourceCodeLocation.endOffset);
                    const original = raw.trim();
                    const startOffset = first + raw.indexOf(original);
                    const endOffset = startOffset + original.length;
                    const leaves = ranges.filter(r => r.startOffset < endOffset && r.endOffset > startOffset)
                        .flatMap(r => {
                            const text = html.slice(r.startOffset, r.endOffset), trimmed = text.trim();
                            if (!/\p{L}/u.test(trimmed)) return [];
                            const start = r.startOffset + text.indexOf(trimmed) - startOffset;
                            return [[start, start + trimmed.length, textId(trimmed)]];
                        });
                    if (leaves.length > 1 && original.length <= 12000) blocks.push({ startOffset, endOffset, leaves });
                }
                run = [];
            }
            for (const child of el.childNodes ?? []) {
                if (!inlineNode(child)) { flush(); scan(child); continue; }
                run.push(child);
                function collect(n) {
                    if (n.nodeName === '#text') ranges.push(n.sourceCodeLocation);
                    else n.childNodes.forEach(collect);
                }
                collect(child);
            }
            flush();
        }
        scan(parseFragment(html, { sourceCodeLocationInfo: true }));
        const segments = [...ranges.filter(r => !blocks.some(b => r.startOffset < b.endOffset && r.endOffset > b.startOffset)), ...blocks]
            .sort((a,b) => a.startOffset - b.startOffset);
        let offset = 0;
        parts.forEach((part, i) => {
            const end = offset + part.length;
            if (ts.isTemplateExpression(node) && i < node.templateSpans.length &&
                ranges.some(r => r.startOffset <= end && r.endOffset > end)) markValue(node.templateSpans[i].expression);
            let pos = 0, code = '';
            for (const range of segments) {
                const start = Math.max(offset, range.startOffset) - offset;
                const stop = Math.min(end, range.endOffset) - offset;
                if (stop <= start || start < pos) continue;
                const segment = part.slice(start, stop);
                const original = segment.trim();
                if (!/\p{L}/u.test(original)) continue;
                const id = range.leaves ? textId(original).replace(':tekst:', ':akapit:') : textId(original);
                const label = (range.leaves ? original.replace(/<[^>]+>/g,'') : original).replace(/\s+/g,' ').slice(0,120);
                entries.set(id, { id, language, group: 'Tekst ' + channel, label, original, ...(range.leaves && { leaves: range.leaves }) });
                const left = start + segment.indexOf(original);
                const args = [key,id,original];
                if (range.leaves) args.push(range.leaves);
                code += quote(part.slice(pos, left)) + '${' + (range.leaves ? '__listingBlock' : '__listingCopy') + '(' + args.map(s => JSON.stringify(s)).join(',') + ')}';
                pos = left + original.length;
            }
            if (pos) {
                const token = tokens[i];
                const head = i === 0 ? '`' : '}';
                const tail = i === tokens.length - 1 ? '`' : '${';
                edits.push([token.getStart(file), token.end, head + code + quote(part.slice(pos)) + tail]);
            }
            offset = end + 1;
        });
    }
    function visit(node, inFunction) {
        if (inFunction && !ts.isTaggedTemplateExpression(node.parent) && !ts.isJsxAttribute(node.parent)) {
            if (ts.isTemplateExpression(node)) literal([node.head,...node.templateSpans.map(s => s.literal)], node);
            else if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) literal([node], node);
        }
        ts.forEachChild(node, child => visit(child, inFunction || ts.isFunctionLike(node)));
    }
    visit(file, false);
    let end = source.length;
    const chunks = [];
    for (const [start,stop,code] of edits.sort((a,b) => b[0]-a[0])) {
        chunks.push(source.slice(stop,end), code);
        end = start;
    }
    return { entries: [...entries.values()], code: edits.length ? "import { templateCopy as __listingCopy, listingBlock as __listingBlock } from '/src/templateCopy';\n" + source.slice(0,end) + chunks.reverse().join('') : source };
}

export function templateCopyPlugin() {
    const files = new Map(), cache = new Map();
    const virtual = 'virtual:listing-copy';
    function compile(id, content) {
        const previous = cache.get(id);
        if (previous?.content === content) return previous.result;
        const [key, filename] = files.get(id);
        const result = compileCopy(content, filename, key);
        cache.set(id, { content, result });
        return result;
    }
    return {
        name: 'listing-copy', enforce: 'pre',
        configResolved(config) {
            for (const [key, list] of Object.entries(sources)) for (const filename of list)
                files.set(resolve(config.root, 'src/addProduct', filename), [key,filename]);
        },
        resolveId(id) { if (id === virtual) return '\0' + virtual; },
        load(id) {
            if (id !== '\0' + virtual) return;
            const catalog = {};
            for (const [path,[key]] of files) {
                this.addWatchFile(path);
                const list = catalog[key] ??= {};
                for (const e of compile(path, readFileSync(path,'utf8')).entries) list[e.id] = e;
            }
            return 'export default ' + JSON.stringify(Object.fromEntries(Object.entries(catalog).map(([key, list]) => [key,Object.values(list)])));
        },
        transform(content, id) { if (files.has(id)) return compile(id,content).code; },
        handleHotUpdate({ file, server, modules }) {
            if (!files.has(file)) return;
            const mod = server.moduleGraph.getModuleById('\0' + virtual);
            if (mod) return [...modules,mod];
        },
    };
}
