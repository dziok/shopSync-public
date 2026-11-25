import type { Attribute } from '../types';
import type { CatalogField } from '../allegroParameters/catalog';
import { phoneFieldForAttribute, PHONE_ATTRIBUTE_FIELDS, phoneFieldLabel, type PhoneAttributeField } from './phoneShoperAttributes';

export type AiField = { id: string; key: string; label: string; kind: string; choices?: string[]; locked?: boolean };
export type AiValue = string | boolean | string[];
const phoneChecks = new Set<PhoneAttributeField>(['waterproof', 'dualSim', 'wirelessCharging', 'NFC', 'G5', 'lens_ultraWide', 'lens_tele', 'lens_lidar']);
const phoneNumbers = new Set<PhoneAttributeField>(['batteryCapacity', 'batteryStatus']);
const phoneLabels: Partial<Record<PhoneAttributeField, string>> = {
    system: 'System operacyjny', batteryCapacity: 'Pojemność baterii (mAh)', batteryStatus: 'Kondycja baterii (%)',
    frontCamera: 'Aparat przedni (MPX)', backCamera: 'Aparat tylny (MPX)', diagonal: 'Przekątna ekranu (cale)',
};
const extras: Record<string, Record<string, string>> = {
    'damaged-laptop': {
        model: 'Model',
        cpu: 'Procesor',
        gpu: 'Karta graficzna',
        ramAmount: 'Pamięć RAM',
        screen: 'Ekran',
        battery: 'Stan baterii',
        diskSize: 'Pojemność dysku',
        visualCondition: 'Opis stanu',
    },
    gaming: {
        additionalInfo: 'Uwagi',
        powerSupplyModel: 'Model zasilacza',
        ramModel: 'Model RAM',
        caseModel: 'Model obudowy',
        cpuFanModel: 'Model chłodzenia CPU',
    },
};
export function formFields(
    template: string,
    attrs: Attribute[],
    catalog: CatalogField[],
    locked?: (key: string) => boolean,
): AiField[] {
    const fields: AiField[] = Object.entries({
        name: 'Tytuł',
        SKU: 'SKU',
        stock: 'Ilość',
        price: 'Cena (PLN)',
        ...extras[template],
    }).map(([key, label]) => ({
        id: 's:' + key,
        key,
        label,
        kind: key === 'stock' ? 'integer' : key === 'price' ? 'float' : 'text',
    }));
    const mobile = template === 'ios' || template === 'android';
    const bound = new Set<PhoneAttributeField>();
    for (const a of attrs) {
        if (
            !['0', '1', '2'].includes(String(a.type)) ||
            /product safety|certyfikat|producent odpowiedzialny/i.test(a.name)
        )
            continue;
        const phone = mobile ? phoneFieldForAttribute(a) : undefined;
        if (phone === 'warranty' || (phone && bound.has(phone))) continue;
        if (phone) bound.add(phone);
        const key = phone || 'attribute_' + a.attribute_id;
        fields.push({
            id: 's:' + a.attribute_id,
            key,
            label: a.name,
            kind: String(a.type) === '2' ? 'select' : String(a.type) === '1' || (phone && phoneChecks.has(phone)) ? 'boolean' :
                phone && phoneNumbers.has(phone) ? 'float' : 'text',
            choices: String(a.type) === '2' ? (a.options?.map((o) => o.value) ?? []) : undefined,
        });
    }
    if (mobile) for (const key of PHONE_ATTRIBUTE_FIELDS) {
        if (key === 'warranty' || bound.has(key)) continue;
        fields.push({ id: 's:' + key, key, label: phoneLabels[key] ?? phoneFieldLabel(key),
            kind: phoneChecks.has(key) ? 'boolean' : phoneNumbers.has(key) ? 'float' : 'text' });
    }
    for (const p of catalog)
        fields.push({
            id: 'a:' + p.id,
            key: p.name,
            label: p.name,
            locked: locked?.(p.name),
            kind: p.dictionary ? (p.restrictions?.multipleChoices ? 'multi' : 'select') : p.type,
            choices: p.dictionary?.map((o) => o.value),
        });
    return [...new Map(fields.map((f) => [f.id, f])).values()];
}
export function validateSuggestion(field: AiField, values: string[]): AiValue | undefined {
    if (
        field.locked ||
        !Array.isArray(values) ||
        !values.length ||
        values.length > 100 ||
        values.some((v) => typeof v !== 'string' || !v.trim() || /[<>]/.test(v) || v.length > 2000) ||
        (field.kind !== 'multi' && values.length !== 1)
    )
        return;
    const v = values[0].trim();
    if (field.choices && values.some((s) => field.choices!.filter((option) => option === s).length !== 1)) return;
    if (field.kind === 'multi') return [...new Set(values)];
    if (field.kind === 'boolean') return v === 'true' ? true : v === 'false' ? false : undefined;
    if (field.id === 's:name' && v.length > 75) return;
    if (field.id === 's:price' && (!/^\d+(?:[.,]\d{1,2})?$/.test(v) || Number(v.replace(',', '.')) <= 0)) return;
    if (field.id === 's:stock' && !/^\d+$/.test(v)) return;
    if (field.kind === 'integer' && !/^-?\d+$/.test(v)) return;
    if (field.kind === 'float' && !/^-?\d+(?:[.,]\d+)?$/.test(v)) return;
    return field.kind === 'float' ? v.replace(',', '.') : v;
}
