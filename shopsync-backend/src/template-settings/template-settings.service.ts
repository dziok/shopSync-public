import { BadRequestException, Injectable } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';
import { randomUUID } from 'crypto';

export const TEMPLATE_KEYS = [
  'pc', 'gaming', 'monitor', 'custom', 'damaged-laptop',
  'laptop', 'laptop-new', 'ios', 'android', 'cpu',
] as const;
export type TemplateKey = (typeof TEMPLATE_KEYS)[number];
export type LocalizedText = { pl: string; cz: string; sk: string };
export type DescriptionRule = {
  id: string;
  placement: 'before' | 'after';
  field: 'always' | 'attribute' | 'category' | 'name' | 'sku';
  attributeId: string;
  match: 'equals' | 'contains';
  value: string;
  text: LocalizedText;
};
export type BlockRule = {
  mode: 'hide' | 'show-when' | 'hide-when';
  field: 'attribute' | 'category' | 'name' | 'sku';
  attributeId: string;
  match: 'equals' | 'contains';
  value: string;
};
export type TextReplacement = { id: string; label?: string; find: LocalizedText; text: LocalizedText };
export type TemplateSettings = {
  shoper: { categoryId: number | null; gaugeId: number | null; deliveryId: number | null; gfxId: number | null; pkwiu: string };
  apilo: { tax: number | null; status: number | null };
  allegro: { shippingRatesName: string; returnPolicyName: string; warrantyName: string };
  description: { before: LocalizedText; after: LocalizedText; rules: DescriptionRule[]; replacements: TextReplacement[]; blocks: Record<string, BlockRule> };
};
export type TemplateSettingsFile = {
  revision: number;
  updatedAt: string;
  templates: Record<TemplateKey, TemplateSettings>;
};

const localized = (): LocalizedText => ({ pl: '', cz: '', sk: '' });
const emptyTemplate = (): TemplateSettings => ({
  shoper: { categoryId: null, gaugeId: null, deliveryId: null, gfxId: null, pkwiu: '' },
  apilo: { tax: null, status: null },
  allegro: { shippingRatesName: '', returnPolicyName: '', warrantyName: '' },
  description: { before: localized(), after: localized(), rules: [], replacements: [], blocks: {} },
});

const text = (value: unknown, limit: number): string => {
  if (value == null) return '';
  if (typeof value !== 'string' || value.length > limit) throw new BadRequestException('Invalid template text.');
  return value.trim();
};
const numberOrNull = (value: unknown, max = 1000000000, min = 1): number | null => {
  if (value === '' || value == null) return null;
  if (typeof value !== 'number' && typeof value !== 'string') throw new BadRequestException('Invalid template number.');
  const number = Number(value);
  if (!Number.isInteger(number) || number < min || number > max) throw new BadRequestException('Invalid template number.');
  return number;
};
const object = (value: unknown): Record<string, any> => value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, any> : {};
const normalizeLocalized = (value: unknown): LocalizedText => {
  const input = object(value);
  return { pl: text(input.pl, 5000), cz: text(input.cz, 5000), sk: text(input.sk, 5000) };
};

export function normalizeTemplateSettings(value: unknown): TemplateSettings {
  const input = object(value);
  const shoper = object(input.shoper);
  const apilo = object(input.apilo);
  const allegro = object(input.allegro);
  const description = object(input.description);
  const rules = Array.isArray(description.rules) ? description.rules : [];
  const replacements = Array.isArray(description.replacements) ? description.replacements : [];
  const blocks = Object.entries(object(description.blocks));
  if (rules.length > 200 || replacements.length > 200) throw new BadRequestException('Too many description entries.');
  if (blocks.length > 100) throw new BadRequestException('Too many block rules.');

  return {
    shoper: {
      categoryId: numberOrNull(shoper.categoryId), gaugeId: numberOrNull(shoper.gaugeId),
      deliveryId: numberOrNull(shoper.deliveryId), gfxId: numberOrNull(shoper.gfxId),
      pkwiu: text(shoper.pkwiu, 80),
    },
    apilo: { tax: numberOrNull(apilo.tax, 100, 0), status: numberOrNull(apilo.status, 10, 0) },
    allegro: {
      shippingRatesName: text(allegro.shippingRatesName, 120),
      returnPolicyName: text(allegro.returnPolicyName, 120),
      warrantyName: text(allegro.warrantyName, 120),
    },
    description: {
      before: normalizeLocalized(description.before), after: normalizeLocalized(description.after),
      rules: rules.map((raw: unknown) => {
        const rule = object(raw);
        if (!['always', 'attribute', 'category', 'name', 'sku'].includes(rule.field)) throw new BadRequestException('Invalid rule field.');
        if (!['equals', 'contains'].includes(rule.match)) throw new BadRequestException('Invalid rule match.');
        const placement = rule.placement ?? 'after';
        if (!['before', 'after'].includes(placement)) throw new BadRequestException('Invalid rule placement.');
        const attributeId = text(rule.attributeId, 20);
        const value = text(rule.value, 250);
        if (rule.field === 'attribute' && !/^\d+$/.test(attributeId)) throw new BadRequestException('Invalid attribute ID.');
        if (rule.field !== 'always' && !value) throw new BadRequestException('Rule value is required.');
        return {
          id: text(rule.id, 80) || randomUUID(), placement, field: rule.field, attributeId,
          match: rule.match, value, text: normalizeLocalized(rule.text),
        } as DescriptionRule;
      }),
      replacements: replacements.map((raw: unknown) => {
        const replacement = object(raw);
        const find = normalizeLocalized(replacement.find);
        if (!Object.values(find).some(Boolean) || Object.values(find).some((value) => /[<>]/.test(value))) {
          throw new BadRequestException('Invalid replacement text.');
        }
        return { id: text(replacement.id, 80) || randomUUID(), label: text(replacement.label, 120), find, text: normalizeLocalized(replacement.text) };
      }),
      blocks: Object.fromEntries(blocks.map(([id, raw]) => {
        const rule = object(raw);
        if (!/^[a-z][a-z0-9-]{0,79}$/.test(id)) throw new BadRequestException('Invalid block ID.');
        if (!['hide', 'show-when', 'hide-when'].includes(rule.mode)) throw new BadRequestException('Invalid block mode.');
        const field = rule.field ?? 'attribute';
        const match = rule.match ?? 'equals';
        if (!['attribute', 'category', 'name', 'sku'].includes(field) || !['equals', 'contains'].includes(match)) {
          throw new BadRequestException('Invalid block condition.');
        }
        const attributeId = text(rule.attributeId, 20);
        const value = text(rule.value, 250);
        if (rule.mode !== 'hide' && ((field === 'attribute' && !/^\d+$/.test(attributeId)) || !value)) {
          throw new BadRequestException('Incomplete block condition.');
        }
        return [id, { mode: rule.mode, field, attributeId, match, value } as BlockRule];
      })) as Record<string, BlockRule>,
    },
  };
}

@Injectable()
export class TemplateSettingsService {
  private pending: Promise<unknown> = Promise.resolve();
  private readonly filePath = path.join(process.cwd(), 'template-settings.json');

  private defaults(): TemplateSettingsFile {
    return {
      revision: 1,
      updatedAt: new Date().toISOString(),
      templates: Object.fromEntries(TEMPLATE_KEYS.map((key) => [key, emptyTemplate()])) as Record<TemplateKey, TemplateSettings>,
    };
  }

  async getSettings(): Promise<TemplateSettingsFile> {
    let raw: string;
    try {
      raw = await fs.readFile(this.filePath, 'utf8');
    } catch (error: any) {
      if (error?.code !== 'ENOENT') throw error;
      return this.defaults();
    }
    const parsed = JSON.parse(raw);
    const defaults = this.defaults();
    return {
      revision: Number(parsed.revision) || 1,
      updatedAt: String(parsed.updatedAt || defaults.updatedAt),
      templates: Object.fromEntries(TEMPLATE_KEYS.map((key) => [
        key, normalizeTemplateSettings(parsed.templates?.[key] ?? defaults.templates[key]),
      ])) as Record<TemplateKey, TemplateSettings>,
    };
  }

  save(key: string, input: unknown, expectedRevision: number) {
    if (!TEMPLATE_KEYS.includes(key as TemplateKey)) throw new BadRequestException('Unknown template.');
    const settings = normalizeTemplateSettings(input);
    const saveOperation = this.pending.then(async () => {
      const current = await this.getSettings();
      if (current.revision !== expectedRevision) return { conflict: true, settings: current };
      const next: TemplateSettingsFile = {
        ...current, revision: current.revision + 1, updatedAt: new Date().toISOString(),
        templates: { ...current.templates, [key]: settings },
      };
      const tempPath = `${this.filePath}.${process.pid}.${Date.now()}.tmp`;
      try {
        await fs.writeFile(tempPath, JSON.stringify(next, null, 2), { mode: 0o600 });
        await fs.rename(tempPath, this.filePath);
      } finally {
        await fs.rm(tempPath, { force: true });
      }
      return { conflict: false, settings: next };
    });
    this.pending = saveOperation.catch(() => undefined);
    return saveOperation;
  }
}
