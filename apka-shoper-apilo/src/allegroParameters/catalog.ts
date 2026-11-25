import { createContext, useContext, useMemo } from 'react';
import type { Product } from '../types';
import { pcNewParameteres } from './pcNewParameteres';
import { pcParametersAll } from './pcParametersAll';
import { MonitorParametersAllegro } from './monitorParameters';
import { laptopParametersAllegro } from './laptopParameters';

type Choice = { id: string; value: string; dependsOnValueIds?: string[]; apiValue?: string };
export type CatalogField = {
    id: string; name: string; type: string; unit?: string | null; shoper?: string;
    required?: boolean; requiredForProduct?: boolean; displayedIf?: unknown; requiredIf?: unknown;
    restrictions?: { multipleChoices?: boolean }; options?: { describesProduct?: boolean }; dictionary?: Choice[];
};
export type CatalogSnapshot = { categoryId: string; fetchedAt: string; parameters: CatalogField[] };
export const categoryIds = { pc: '486', gaming: '486', monitor: '260041', 'laptop-new': '491' } as const;
export type CatalogKey = keyof typeof categoryIds;
export const hasCatalog = (key: string): key is CatalogKey => Object.prototype.hasOwnProperty.call(categoryIds, key);
const base: Record<CatalogKey, CatalogField[]> = {
    pc: pcNewParameteres, gaming: pcParametersAll, monitor: MonitorParametersAllegro, 'laptop-new': laptopParametersAllegro,
};

// The two PC templates share category 486. Do not reintroduce fields or choices
// deliberately left out of the gaming version of that original category.
const gamingExclusions = new Set(base.pc.flatMap(p => {
    const gaming = base.gaming.find(g => g.id === p.id);
    if (!gaming) return [p.id];
    const included = new Set(gaming.dictionary?.map(d => d.id));
    return (p.dictionary ?? []).map(d => d.id).filter(id => !included.has(id));
}));

export function resolveCatalog(key: CatalogKey, snapshot?: CatalogSnapshot): CatalogField[] {
    if (!snapshot || snapshot.categoryId !== categoryIds[key]) return base[key];
    const remote = new Map(snapshot.parameters.map(p => [p.id, p]));
    const keep = (id: string) => key !== 'gaming' || !gamingExclusions.has(id);
    const ids = [...new Set([...base[key].map(p => p.id), ...remote.keys()])];
    return ids.flatMap(id => {
        const api = remote.get(id);
        if (!api || !keep(id)) return [];
        const local = base[key].find(p => p.id === id);
        const result: CatalogField = { ...local, ...api, name: local?.name ?? api.name,
            type: local?.type === 'dictionary_ac' && api.type === 'dictionary' ? local.type : api.type };
        if (api.type === 'dictionary') {
            const options = new Map(api.dictionary!.map(d => [d.id, d]));
            const existing = new Set(local?.dictionary?.map(d => d.id));
            // Multiple local labels can intentionally point at the same Allegro value ID.
            result.dictionary = [
                ...(local?.dictionary ?? []).flatMap(d => {
                    const opt = options.get(d.id);
                    return opt ? [{ ...d, ...opt, value: d.value, apiValue: opt.value }] : [];
                }),
                ...api.dictionary!.filter(d => !existing.has(d.id) && keep(d.id)),
            ];
        } else delete result.dictionary;
        return [result];
    });
}

export const CatalogContext = createContext<CatalogSnapshot | undefined>(undefined);
export function useCatalog(key: CatalogKey) {
    const snapshot = useContext(CatalogContext);
    return useMemo(() => ({ fields: resolveCatalog(key, snapshot), synced: snapshot?.categoryId === categoryIds[key] }), [key, snapshot]);
}

// The forms use local labels as keys; selected Allegro products carry API names.
export function withCatalogLabels(product: Product, fields: CatalogField[]): Product {
    return { ...product, parameters: (product.parameters ?? []).map(p => {
        const field = fields.find(f => f.id === p.id);
        if (!field) return p;
        const byId = (p.valuesIds ?? []).flatMap(id => {
            const choice = field.dictionary?.find(c => c.id === id);
            return choice ? [choice.value] : [];
        });
        const translate = (values?: string[]) => values?.map((v, i) => {
            const match = field.dictionary?.find(c => c.id === p.valuesIds?.[i])
                ?? field.dictionary?.find(c => c.apiValue === v);
            return match?.value ?? v;
        });
        return { ...p, name: field.name, values: translate(p.values),
            valuesLabels: p.valuesLabels?.length ? translate(p.valuesLabels) : byId };
    }) };
}

function stable(value: unknown): string {
    return JSON.stringify(value, (_, v) => v && typeof v === 'object' && !Array.isArray(v)
        ? Object.fromEntries(Object.entries(v).sort(([a], [b]) => a.localeCompare(b))) : v);
}
export function compareCatalog(current: CatalogField[], next: CatalogField[]) {
    const changes: string[] = [], conflicts: string[] = [];
    const details = new Map<string, string[]>();
    const old = new Map(current.map(p => [p.id, p]));
    const names = new Set<string>();
    for (const p of next) {
        const prev = old.get(p.id);
        old.delete(p.id);
        if (names.has(p.name)) conflicts.push(`Dwa pola mają nazwę „${p.name}”.`);
        names.add(p.name);
        const labels = new Map<string, string>();
        const previousLabels = new Map(prev?.dictionary?.map(d => [d.id, d.value]));
        for (const v of p.dictionary ?? []) {
            const other = labels.get(v.value);
            if (other && other !== v.id && (previousLabels.get(other) !== v.value || previousLabels.get(v.id) !== v.value)) {
                conflicts.push(`${p.name}: etykieta „${v.value}” wskazuje na dwa różne ID (${other}, ${v.id}).`);
            }
            labels.set(v.value, v.id);
        }
        if (!prev) { changes.push(`+ ${p.name} (ID ${p.id})`); continue; }
        if (prev.type !== p.type || !!prev.restrictions?.multipleChoices !== !!p.restrictions?.multipleChoices) {
            conflicts.push(`${p.name}: zmiana typu pola lub liczby dozwolonych wyborów.`);
        }
        const before = new Set(prev.dictionary?.map(d => d.id)), after = new Set(p.dictionary?.map(d => d.id));
        const add = [...after].filter(id => !before.has(id)).length, remove = [...before].filter(id => !after.has(id)).length;
        const meta = (f: CatalogField) => [f.required, f.requiredForProduct, f.unit, f.options, f.restrictions, f.requiredIf, f.displayedIf];
        const dependencies = new Map(prev.dictionary?.map(d => [d.id, d.dependsOnValueIds ?? []]));
        const rules = stable(meta(prev)) !== stable(meta(p)) || p.dictionary?.some(d =>
            dependencies.has(d.id) && stable(dependencies.get(d.id)) !== stable(d.dependsOnValueIds ?? []));
        if (add || remove || rules) {
            const summary = `${p.name}: ${[
            add && `nowe opcje: ${add}`, remove && `wycofane opcje: ${remove}`, rules && 'zmiana reguł',
            ].filter(Boolean).join(', ')}`;
            changes.push(summary);
            if (add || remove) details.set(summary, [
                ...(p.dictionary ?? []).filter(d => !before.has(d.id)).map(d => `+ ${d.value} (${d.id})`),
                ...(prev.dictionary ?? []).filter(d => !after.has(d.id)).map(d => `− ${d.value} (${d.id})`),
            ]);
        }
    }
    old.forEach(p => {
        changes.push(`− ${p.name} (ID ${p.id})`);
        if (p.shoper) conflicts.push(`${p.name}: Allegro wycofało pole z lokalną konfiguracją gamingową.`);
    });
    if (!next.some(p => current.some(q => q.id === p.id))) conflicts.push('Brak wspólnych parametrów z bieżącym katalogiem.');
    return { changes, conflicts, details };
}
