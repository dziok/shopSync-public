import { BadRequestException } from '@nestjs/common';

const categories = new Map([['pc', '486'], ['gaming', '486'], ['monitor', '260041'], ['laptop-new', '491']]);
export function catalogCategory(key: string) {
  const id = categories.get(key);
  if (!id) throw new BadRequestException('Ten szablon nie ma katalogu parametrów Allegro.');
  return id;
}

type Option = { id: string; value: string; dependsOnValueIds?: string[] };
export type CatalogParameter = {
  id: string; name: string; type: string; required: boolean; requiredForProduct: boolean;
  unit?: string | null; requiredIf?: unknown; displayedIf?: unknown;
  options: { describesProduct: boolean }; restrictions: { multipleChoices?: boolean };
  dictionary?: Option[];
};
export type CatalogSnapshot = { categoryId: string; fetchedAt: string; parameters: CatalogParameter[] };

function invalid(): never { throw new BadRequestException('Niekompletny lub nieprawidłowy katalog parametrów Allegro.'); }
const record = (v: unknown): v is Record<string, any> => !!v && typeof v === 'object' && !Array.isArray(v);
const label = (v: unknown) => typeof v === 'string' && !!v.trim() && v.length <= 1000;
function uniqueId(value: unknown, seen: Set<string>, pattern: RegExp) {
  if (typeof value !== 'string' || !pattern.test(value) || seen.has(value)) return invalid();
  seen.add(value);
  return value;
}

export function validateCatalog(raw: unknown, key: string): CatalogSnapshot {
  if (!record(raw) || raw.categoryId !== catalogCategory(key) || typeof raw.fetchedAt !== 'string'
    || raw.fetchedAt !== new Date(Date.parse(raw.fetchedAt) || 0).toISOString()
    || !Array.isArray(raw.parameters) || !raw.parameters.length || raw.parameters.length > 500
    || Buffer.byteLength(JSON.stringify(raw)) > 3_000_000) return invalid();
  const ids = new Set<string>();
  const parameters = raw.parameters.map((p: unknown): CatalogParameter => {
    if (!record(p) || !label(p.name) || !['string', 'float', 'integer', 'dictionary'].includes(p.type)
      || typeof p.required !== 'boolean' || typeof p.requiredForProduct !== 'boolean'
      || !record(p.options) || typeof p.options.describesProduct !== 'boolean'
      || !record(p.restrictions) || (p.restrictions.multipleChoices != null && typeof p.restrictions.multipleChoices !== 'boolean')
      || (p.unit != null && typeof p.unit !== 'string')
      || (p.displayedIf != null && !record(p.displayedIf)) || (p.requiredIf != null && !record(p.requiredIf))) return invalid();
    const id = uniqueId(p.id, ids, /^\d{1,20}$/);
    const result: CatalogParameter = { id, name: p.name, type: p.type, required: p.required, requiredForProduct: p.requiredForProduct,
      unit: p.unit, displayedIf: p.displayedIf, requiredIf: p.requiredIf,
      options: { ...p.options, describesProduct: p.options.describesProduct }, restrictions: { ...p.restrictions } };
    if (p.type === 'dictionary') {
      if (!Array.isArray(p.dictionary) || !p.dictionary.length) return invalid();
      const options = new Set<string>();
      result.dictionary = p.dictionary.map((v: unknown) => {
        if (!record(v) || !label(v.value) || (v.dependsOnValueIds != null &&
          (!Array.isArray(v.dependsOnValueIds) || !v.dependsOnValueIds.every((k: unknown) => typeof k === 'string')))) return invalid();
        return { id: uniqueId(v.id, options, /^[\w-]{1,100}$/), value: v.value, dependsOnValueIds: v.dependsOnValueIds };
      });
    }
    return result;
  });
  return { categoryId: raw.categoryId, fetchedAt: raw.fetchedAt, parameters };
}
