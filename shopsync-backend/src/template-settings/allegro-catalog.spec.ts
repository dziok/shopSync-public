import { validateCatalog } from './allegro-catalog';
import { normalizeTemplateSettings } from './template-settings.service';
import { ProductController } from '../product/product.controller';

const option = { id: '1_10', value: 'Tak' };
const field = { id: '1', name: 'Test', type: 'dictionary', required: true, requiredForProduct: false,
  options: { describesProduct: false }, restrictions: { multipleChoices: false }, dictionary: [option] };
const snapshot = { categoryId: '486', fetchedAt: new Date().toISOString(), parameters: [field] };

describe('template parameter catalog', () => {
  it('requests the fixed category using the selected account and never publishes', async () => {
    const auth = { getAllegroProdAccessToken: jest.fn().mockResolvedValue('token-A') };
    const product = { getCategoryParameters: jest.fn().mockResolvedValue({ parameters: [field] }) };
    const controller = new ProductController(product as any, auth as any);
    const result = await controller.templateParameters('monitor', 'account-A');
    expect(auth.getAllegroProdAccessToken).toHaveBeenCalledWith('account-A');
    expect(product.getCategoryParameters).toHaveBeenCalledWith('token-A', '260041');
    expect(result.categoryId).toBe('260041');
    await expect(controller.templateParameters('ios', 'account-A')).rejects.toThrow();
    expect(product.getCategoryParameters).toHaveBeenCalledTimes(1);
  });
  it('round-trips in settings and remains optional for legacy files and resets', () => {
    const settings = normalizeTemplateSettings({ allegro: { parameterCatalog: snapshot } }, 'pc');
    expect(normalizeTemplateSettings(JSON.parse(JSON.stringify(settings)), 'pc')).toEqual(settings);
    expect(settings.allegro.parameterCatalog.parameters[0].dictionary).toEqual([option]);
    expect(normalizeTemplateSettings({}, 'pc').allegro.parameterCatalog).toBeUndefined();
  });
  it('rejects a wrong template or category, partial results and ambiguous upstream IDs', () => {
    expect(() => validateCatalog(snapshot, 'custom')).toThrow();
    expect(() => validateCatalog(snapshot, 'monitor')).toThrow();
    for (const parameters of [[], [field, field], [{ ...field, options: {} }], [{ ...field, dictionary: [option, option] }]]) {
      expect(() => normalizeTemplateSettings({ allegro: { parameterCatalog: { ...snapshot, parameters } } }, 'pc')).toThrow();
    }
  });
});
