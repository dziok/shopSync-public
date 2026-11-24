import type { ColumnMapping, ImportDraft } from './bulkImport';
import type { Attribute } from './types';
import { resolveImportedShoperAttribute } from './addProduct/allegroComponents/importShoperAttribute';
import { phoneFieldForAttribute } from './addProduct/phoneShoperAttributes';

export type DeliveryProduct = { draft: ImportDraft; mapping: ColumnMapping; photos: File[] };
export const normalized = (v: string) => v.trim().toLowerCase().replace(/ł/g, 'l').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
const safe = (v?: string) => v && !/[<>]/.test(v) ? v.trim() : '';

export function assignDeliveryPhotos(files: File[], skus: string[]) {
    const assigned: Record<number, File[]> = {};
    const unmatched: string[] = [];
    const keys = skus.map(sku => sku.trim().toLowerCase());
    for (const file of files) {
        const stem = file.name.replace(/\.[^.]+$/, '').toLowerCase();
        const matches = keys.map((key, i) => ({ key, i })).filter(({key}) =>
            key && (stem === key || (stem.startsWith(key) && /^[ _.-]/.test(stem.slice(key.length)))));
        matches.sort((a,b) => b.key.length - a.key.length);
        if (!file.type.startsWith('image/') || !matches.length || matches[0].key === matches[1]?.key) {
            unmatched.push(file.name);
        } else {
            (assigned[matches[0].i] ??= []).push(file);
        }
    }
    return { assigned, unmatched };
}

export function deliveryFields({ draft, mapping }: DeliveryProduct, attributes: Attribute[]) {
    const row = draft.source;
    const values: Record<string, string | number | boolean> = {};
    const skipped: string[] = [];
    const facts = new Map<string, string>();
    const fact = (v: string | undefined, ...names: string[]) => {
        if (safe(v)) for (const name of names) facts.set(normalized(name), safe(v));
    };
    // AI supplies candidate attribute labels, never internal field names or IDs.
    for (const field of draft.aiFields) fact(field.value, field.name);
    fact(row[mapping.model], 'Model', 'Model telefonu');
    fact(row[mapping.manufacturer], 'Marka', 'Producent');
    fact(row.Processor, 'Procesor', 'Model procesora');
    if (draft.template === 'pc') {
        const intel = row.Processor?.match(/\b(i[3579])[- ](\d{4,5}[A-Z]{0,3})\b/i);
        const amd = row.Processor?.match(/\bRYZEN ([3579]) (PRO )?(\d{4}[A-Z]{0,3})\b/i);
        const ultra = row.Processor?.match(/\bCore(?:\(TM\)|™)?\s+Ultra\s+([579])\b(?:[\s-]+(?:Processor\s+)?(\d{3}[A-Z]{0,3})\b)?/i);
        if (ultra) {
            fact('Intel Core Ultra ' + ultra[1], 'Seria', 'Seria procesora');
            facts.delete(normalized('Model procesora'));
            fact(ultra[2]?.toUpperCase(), 'Model procesora');
        } else if (intel || amd) {
            fact(intel ? 'Intel Core ' + intel[1].toLowerCase() : 'AMD Ryzen ' + amd![1], 'Seria', 'Seria procesora');
            fact(intel ? intel[2] : (amd![2] || '') + amd![3], 'Model procesora');
        }
    }
    fact(row.DisplaySize, 'Przekątna ekranu', 'Wielkość matrycy', 'Rozmiar ekranu');
    fact(row.Resolution, 'Rozdzielczość', 'Rozdzielczość ekranu', 'Rozdzielczość (px)');
    fact(row.Chassis, 'Typ obudowy', 'Rodzaj obudowy');
    fact(row.Videocard, 'Chipset karty graficznej', 'Model karty graficznej');
    fact(row['%Battery'], 'Kondycja baterii', 'Kondycja baterii (%)');
    fact(row.ObservNotes, 'Uwagi');
    const grade = row[mapping.condition]?.trim();
    fact(grade && /^[ABC][+-]?$/i.test(grade) ? 'Klasa ' + grade.toUpperCase() : grade, 'Klasa wizualna', 'Stan wizualny');
    const capacity = (s: string) => s?.match(/^\s*(\d+(?:[.,]\d+)?)\s*(GB|TB)\b/i)?.slice(1).join(' ').toUpperCase();
    fact(capacity(row.RAM), 'Wielkość pamięci RAM', 'Ilość pamięci RAM', 'Pamięć RAM', 'Pojemność RAM');
    fact(row.RAM?.match(/\b(?:LP)?DDR[2-6]X?\b/i)?.[0], 'Typ pamięci RAM', 'Rodzaj pamięci RAM');
    fact(capacity(row.Storage1_Info), 'Pojemność dysku', 'Pojemność pamięci', 'Pamięć wbudowana');
    const storage = row.Storage1_Info || '';
    const combined = storage.match(/\bEMMC\s*\+\s*(SSD\s*\(m2\)|M\.2\s+NVME\b|SSD\b)/i);
    fact(combined ? 'EMMC + ' + (/nvme/i.test(combined[1]) ? 'M.2 NVME' : /m2/i.test(combined[1]) ? 'SSD (m2)' : 'SSD')
        : storage.match(/\b(NVME|SSD|HDD|FLASH)\b/i)?.[0], 'Typ dysku', 'Typ dysku twardego', 'Rodzaj dysku');
    if (safe(row[mapping.sku])) values.SKU = safe(row[mapping.sku]);
    if (safe(draft.title)) values.name = safe(draft.title);
    if (/^\d+(?:[.,]\d{1,2})?$/.test(draft.price.trim()) && Number(draft.price.replace(',', '.')) > 0) values.price = Number(draft.price.replace(',', '.'));
    const qty = Object.entries(row).find(([key]) => ['ilosc', 'stock', 'quantity', 'qty'].includes(normalized(key)));
    if (!qty || /^\d+$/.test(qty[1].trim())) values.stock = qty ? Number(qty[1]) : 1;
    else skipped.push('Ilość: ' + qty[1]);
    values.active = false;
    const mobile = draft.template === 'ios' || draft.template === 'android';
    if (draft.template === 'ios') {
        if (/\biphone\b/i.test(row[mapping.model])) values.category = '314';
        if (/\bipad\b/i.test(row[mapping.model])) values.category = '331';
    }
    if (draft.template === 'damaged-laptop') {
        for (const [field, name] of Object.entries({model:'Model', cpu:'Procesor', ramAmount:'Pamięć RAM', gpu:'Model karty graficznej'})) {
            const v = facts.get(normalized(name)); if (v) values[field] = v;
        }
    }
    for (const attr of attributes) {
        const raw = safe(row[attr.name]) || facts.get(normalized(attr.name)) || facts.get(normalized(attr.name.replace(/\s*\([^)]*\)\s*$/, '')));
        if (!raw) continue;
        const choices = [raw];
        if (/^\d+(?:[.,]\d+)?$/.test(raw)) {
            if (/przekatna|wielkosc matrycy|rozmiar ekranu/.test(normalized(attr.name))) choices.push(raw + '"');
            if (/kondycja baterii/.test(normalized(attr.name))) choices.push(raw + '%');
        }
        const match = resolveImportedShoperAttribute(attr, choices.length > 1 && String(attr.type) === '2' ? choices : raw);
        if (match === undefined) { skipped.push(attr.name + ': ' + raw); continue; }
        const field = mobile ? phoneFieldForAttribute(attr) : undefined;
        values[field ?? ('attribute_' + attr.attribute_id)] = match;
    }
    for (const [key, v] of Object.entries(row)) if (/test result/i.test(key) && /^fail(?:ed)?$/i.test(v.trim())) skipped.push(key + ': ' + v);
    return { values, skipped };
}
