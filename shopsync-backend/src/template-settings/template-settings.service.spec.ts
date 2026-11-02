import { BadRequestException } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { normalizeTemplateSettings, TEMPLATE_KEYS, TemplateSettingsService } from './template-settings.service';

describe('TemplateSettingsService', () => {
  it('provides independent defaults for every template', () => {
    const settings = (new TemplateSettingsService() as any).defaults();
    expect(Object.keys(settings.templates)).toEqual([...TEMPLATE_KEYS]);
    expect(settings.templates.pc.shoper.categoryId).toBeNull();
    expect(settings.templates.gaming.description.rules).toEqual([]);
    expect(settings.templates.gaming.description.blocks).toEqual({});
  });

  it('accepts conditionals and localized replacements', () => {
    const settings = normalizeTemplateSettings({
      shoper: { categoryId: 321 },
      description: {
        rules: [{ id: 'one', placement: 'before', field: 'attribute', attributeId: '762', match: 'equals', value: 'Ryzen 5', text: { pl: 'Opis AMD' } }],
        replacements: [{ id: 'two', label: 'Procesor: AMD', find: { pl: 'stary' }, text: { pl: 'nowy' } }],
        blocks: { cpu: { mode: 'show-when', field: 'attribute', attributeId: '762', match: 'contains', value: 'Ryzen' } },
      },
    });
    expect(settings.shoper.categoryId).toBe(321);
    expect(settings.description.rules[0].text.pl).toBe('Opis AMD');
    expect(settings.description.rules[0].placement).toBe('before');
    expect(settings.description.replacements[0].find.pl).toBe('stary');
    expect(settings.description.replacements[0].label).toBe('Procesor: AMD');
    expect(settings.description.blocks.cpu.value).toBe('Ryzen');
  });

  it('rejects invalid identifiers and HTML in replacement search text', () => {
    expect(() => normalizeTemplateSettings({ shoper: { categoryId: -1 } })).toThrow(BadRequestException);
    expect(() => normalizeTemplateSettings({ description: {
      rules: [{ field: 'attribute', attributeId: 'bad', match: 'equals', value: 'x' }],
    } })).toThrow(BadRequestException);
    expect(() => normalizeTemplateSettings({ description: {
      replacements: [{ find: { pl: '<div>' }, text: { pl: 'x' } }],
    } })).toThrow(BadRequestException);
    expect(() => normalizeTemplateSettings({ description: {
      blocks: { cpu: { mode: 'show-when', field: 'attribute', attributeId: '', value: 'Ryzen' } },
    } })).toThrow(BadRequestException);
  });

  it('persists settings and rejects a stale revision', async () => {
    const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'shopsync-template-settings-'));
    const filePath = path.join(directory, 'settings.json');
    try {
      const service = new TemplateSettingsService();
      (service as any).filePath = filePath;
      const initial = await service.getSettings();
      const saved = await service.save('pc', { shoper: { categoryId: 321 }, description: {
        blocks: { photo: { mode: 'hide', field: 'attribute', match: 'equals' } },
      } }, initial.revision);
      expect(saved.conflict).toBe(false);
      expect(saved.settings.revision).toBe(initial.revision + 1);

      const reloaded = new TemplateSettingsService();
      (reloaded as any).filePath = filePath;
      expect((await reloaded.getSettings()).templates.pc.shoper.categoryId).toBe(321);
      expect((await reloaded.getSettings()).templates.pc.description.blocks.photo.mode).toBe('hide');
      const stale = await reloaded.save('gaming', { shoper: { categoryId: 223 } }, initial.revision);
      expect(stale.conflict).toBe(true);
      expect((await reloaded.getSettings()).templates.gaming.shoper.categoryId).toBeNull();
    } finally {
      await fs.rm(directory, { recursive: true, force: true });
    }
  });
});
