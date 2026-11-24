export type ImportRow = Record<string, string>;
export type ImportTemplate = 'pc' | 'gaming' | 'monitor' | 'laptop-new' | 'damaged-laptop' | 'ios' | 'android' | 'custom' | 'unknown';
export type ColumnMapping = { sku: string; manufacturer: string; model: string; price: string; condition: string };
export type ImportDraft = { source: ImportRow; template: ImportTemplate; title: string; price: string; issues: string[]; aiFields: { name: string; value: string }[]; aiIssues: string[]; confidence?: number };

export const TEMPLATE_LABELS: Record<ImportTemplate, string> = {
    pc: 'Komputery biurowe', gaming: 'Komputery gamingowe', monitor: 'Monitory',
    'laptop-new': 'Laptopy nowe', 'damaged-laptop': 'Uszkodzone laptopy',
    ios: 'Mobilki iOS', android: 'Mobilki Android', custom: 'Inne', unknown: 'Nieustalony',
};

export const defaultMapping = (headers: string[]): ColumnMapping => {
    const find = (...aliases: string[]) => headers.find(header => aliases.some(alias => header.trim().toLowerCase() === alias)) || '';
    return {
        sku: find('sku', 'kod', 'code'),
        manufacturer: find('manufacturer', 'producent', 'marka'),
        model: find('model'),
        price: find('price', 'cena'),
        condition: find('grade', 'stan'),
    };
};

export const suggestTemplate = (row: ImportRow, mapping: ColumnMapping): ImportTemplate => {
    const text = `${row[mapping.sku] || ''} ${row.Chassis || ''} ${row[mapping.manufacturer] || ''} ${row[mapping.model] || ''}`.toLowerCase();
    if (/iphone|ipad|\bapple\b.*\bphone\b/.test(text)) return 'ios';
    if (/samsung|xiaomi|motorola|android/.test(text) && /phone|smartfon|galaxy/.test(text)) return 'android';
    if (/monitor|display|\bdcm\d|\bmon\d/.test(text) || (row.DisplaySize && !row.Processor && !row.RAM)) return 'monitor';
    if (/laptop|notebook|thinkpad|latitude|elitebook|probook/.test(text)) return 'laptop-new';
    if (/gaming|geforce rtx|radeon rx/.test(text)) return 'gaming';
    if (row.Processor || row.RAM || /\b[dh]pc\d|\blpc\d/.test(text)) return 'pc';
    return 'unknown';
};

export const validateDraft = (draft: ImportDraft, mapping: ColumnMapping, duplicateSku = false): string[] => {
    const row = draft.source;
    const issues: string[] = [];
    if (!row[mapping.sku]?.trim()) issues.push('Brak SKU');
    if (duplicateSku) issues.push('Powtórzone SKU w pliku');
    if (!row[mapping.manufacturer]?.trim()) issues.push('Brak producenta');
    if (!row[mapping.model]?.trim()) issues.push('Brak modelu');
    if (!draft.price.trim()) issues.push('Brak ceny');
    else if (!/^\d+(?:[.,]\d{1,2})?$/.test(draft.price.trim()) || Number(draft.price.replace(',', '.')) <= 0) issues.push('Nieprawidłowa cena');
    if (draft.template === 'unknown') issues.push('Nieustalony szablon');
    const inferred = suggestTemplate(row, mapping);
    if (inferred !== 'unknown' && draft.template !== inferred) issues.push(`Wybrany szablon różni się od rozpoznanego z CSV: ${TEMPLATE_LABELS[inferred]}`);
    if (!draft.title.trim()) issues.push('Brak tytułu');
    if (draft.title.length > 75) issues.push('Tytuł jest dłuższy niż 75 znaków');
    if (row[mapping.model]?.trim() && draft.title.trim() && !draft.title.toLowerCase().includes(row[mapping.model].trim().toLowerCase())) issues.push('Tytuł nie zawiera modelu z CSV');
    if (draft.template === 'monitor' && !row.Resolution?.trim()) issues.push('Monitor bez rozdzielczości');
    if ((draft.template === 'pc' || draft.template === 'gaming' || draft.template === 'laptop-new') && !row.Processor?.trim()) issues.push('Komputer bez procesora');
    for (const field of draft.aiFields) {
        const sourceValue = field.name.toLowerCase() === 'model' ? row[mapping.model] : field.name.toLowerCase() === 'manufacturer' ? row[mapping.manufacturer] : '';
        if (sourceValue?.trim() && field.value?.trim() && sourceValue.trim().toLowerCase() !== field.value.trim().toLowerCase()) {
            issues.push(`AI podało inne ${field.name} niż CSV`);
        }
    }
    return issues;
};

export const makeDrafts = (rows: ImportRow[], mapping: ColumnMapping): ImportDraft[] => {
    const seen = new Map<string, number>();
    for (const row of rows) {
        const sku = row[mapping.sku]?.trim().toLowerCase();
        if (sku) seen.set(sku, (seen.get(sku) || 0) + 1);
    }
    return rows.map(source => {
        const template = suggestTemplate(source, mapping);
        const title = [source[mapping.manufacturer], source[mapping.model]].filter(Boolean).join(' ').trim();
        const draft: ImportDraft = { source, template, title, price: source[mapping.price] || '', issues: [], aiFields: [], aiIssues: [] };
        draft.issues = validateDraft(draft, mapping, (seen.get(source[mapping.sku]?.trim().toLowerCase()) || 0) > 1);
        return draft;
    });
};
