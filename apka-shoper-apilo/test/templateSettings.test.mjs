import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { build } from 'esbuild';

const bundle = await build({
    entryPoints: [new URL('../src/templateSettings.ts', import.meta.url).pathname],
    bundle: true, platform: 'node', format: 'esm', write: false,
});
const { ACTIVE_TEMPLATE_KEYS, applyTemplateSettings, applyDescriptionSettings } = await import(
    `data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].contents).toString('base64')}`
);

const dom = new JSDOM('<!doctype html><html><body></body></html>');
globalThis.document = dom.window.document;
globalThis.NodeFilter = dom.window.NodeFilter;

const settings = () => ({
    shoper: { categoryId: 321, gaugeId: 5, deliveryId: 2, gfxId: null, pkwiu: '' },
    apilo: { tax: 8, status: 1 },
    allegro: { shippingRatesName: 'Cennik', returnPolicyName: 'Zwroty', warrantyName: '' },
    description: {
        before: { pl: 'Początek', cz: '', sk: '' }, after: { pl: '', cz: '', sk: '' },
        rules: [{ id: 'one', field: 'attribute', attributeId: '762', match: 'equals', value: 'Ryzen 5',
            text: { pl: 'Opis procesora', cz: 'Popis procesoru', sk: '' } }],
        replacements: [{ id: 'two', find: { pl: 'stary', cz: '', sk: '' },
            text: { pl: 'nowy', cz: '', sk: '' } }],
        blocks: {},
    },
});

test('Shoper receives fixed fields and conditional localized copy', () => {
    const original = {
        category_id: 249, gauge_id: 6, stock: { price: 100, delivery_id: 1 },
        attributes: { 762: 'Ryzen 5' },
        translations: { pl_PL: { name: 'PC', description: '<p>stary opis</p>' },
            cs_CZ: { name: 'PC', description: '<p>popis</p>' } },
    };
    const result = applyTemplateSettings(original, '/api/product/shoper', settings());
    assert.equal(result.category_id, 321);
    assert.equal(result.stock.delivery_id, 2);
    assert.equal(result.stock.price, 100);
    assert.match(result.translations.pl_PL.description, /Początek/);
    assert.match(result.translations.pl_PL.description, /nowy opis/);
    assert.match(result.translations.pl_PL.description, /Opis procesora/);
    assert.match(result.translations.cs_CZ.description, /Popis procesoru/);
    assert.equal(original.category_id, 249);
    assert.equal(original.translations.pl_PL.description, '<p>stary opis</p>');
});

test('translation update uses attributes from the preceding product request', () => {
    const result = applyTemplateSettings(
        { translations: { sk_SK: { description: '<p>Popis</p>' } } }, '/api/product/42',
        { ...settings(), description: { ...settings().description,
            rules: [{ ...settings().description.rules[0], text: { pl: '', cz: '', sk: 'Opis AMD' } }],
        } }, { attributes: { 762: 'Ryzen 5' } },
    );
    assert.match(result.translations.sk_SK.description, /Opis AMD/);
});

test('Apilo and Allegro use their own fixed settings', () => {
    const apilo = applyTemplateSettings([{ sku: 'A', tax: 23, status: 0, description: '<p>opis</p>' }], '/api/product/apilo', settings());
    assert.equal(apilo[0].tax, 8);
    assert.equal(apilo[0].status, 1);
    const allegro = applyTemplateSettings({ stock: { available: 2 } }, '/api/product/allegroProduct/account', settings());
    assert.equal(allegro.delivery.shippingRates.name, 'Cennik');
    assert.equal(allegro.afterSalesServices.returnPolicy.name, 'Zwroty');
    assert.equal(allegro.stock.available, 2);
});

test('removed rule text is removed from a previously generated description', () => {
    const previous = applyDescriptionSettings('<p>Opis</p>', 'pl', { attributes: { 762: 'Ryzen 5' } }, settings());
    const reset = settings();
    reset.description.before.pl = '';
    reset.description.rules = [];
    reset.description.replacements = [];
    const next = applyDescriptionSettings(previous, 'pl', {}, reset);
    assert.doesNotMatch(next, /Początek|Opis procesora/);
    assert.match(next, /Opis/);
});

test('an empty replacement removes an existing option description', () => {
    const adjusted = settings();
    adjusted.description.before.pl = '';
    adjusted.description.rules = [];
    adjusted.description.replacements[0].text.pl = '';
    assert.equal(applyDescriptionSettings('<p>stary opis</p>', 'pl', {}, adjusted), '<p> opis</p>');
});

test('deactivated templates are absent from the active list', () => {
    assert.equal(ACTIVE_TEMPLATE_KEYS.includes('laptop'), false);
    assert.equal(ACTIVE_TEMPLATE_KEYS.includes('cpu'), false);
    assert.equal(ACTIVE_TEMPLATE_KEYS.includes('laptop-new'), true);
});

test('conditional block visibility removes only the selected generated section', () => {
    const adjusted = settings();
    adjusted.description.before.pl = '';
    adjusted.description.rules = [];
    adjusted.description.replacements = [];
    adjusted.description.blocks.gpu = {
        mode: 'show-when', field: 'attribute', attributeId: '762', match: 'equals', value: 'Ryzen 7',
    };
    const html = '<div class="g_specBox3" id="gpu">Grafika</div><div class="g_specBox3" id="ram">RAM</div>';
    const hidden = applyTemplateSettings({ attributes: { 762: 'Ryzen 5' }, translations: { pl_PL: { description: html } } },
        '/api/product/shoper', adjusted, undefined, 'gaming');
    assert.doesNotMatch(hidden.translations.pl_PL.description, /Grafika/);
    assert.match(hidden.translations.pl_PL.description, /RAM/);
    const visible = applyTemplateSettings({ attributes: { 762: 'Ryzen 7' }, translations: { pl_PL: { description: html } } },
        '/api/product/shoper', adjusted, undefined, 'gaming');
    assert.match(visible.translations.pl_PL.description, /Grafika/);
});

test('hide-when uses the source product context for translations', () => {
    const adjusted = settings();
    adjusted.description.before.pl = '';
    adjusted.description.rules = [];
    adjusted.description.replacements = [];
    adjusted.description.blocks.pivot = {
        mode: 'hide-when', field: 'attribute', attributeId: '911', match: 'equals', value: 'Nie',
    };
    const html = Array.from({ length: 7 }, (_, index) => `<div class="monitors_section">${index}</div>`).join('');
    const result = applyTemplateSettings({ translations: { cs_CZ: { description: html } } }, '/api/product/42', adjusted,
        { attributes: { 911: 'Nie' } }, 'monitor');
    assert.doesNotMatch(result.translations.cs_CZ.description, />6<\/div>/);
    assert.match(result.translations.cs_CZ.description, />5<\/div>/);
});

test('multiple rules on repeated sections keep their original targets', () => {
    const adjusted = settings();
    adjusted.description.before.pl = '';
    adjusted.description.rules = [];
    adjusted.description.replacements = [];
    adjusted.description.blocks.gpu = { mode: 'hide', field: 'attribute', attributeId: '', match: 'equals', value: '' };
    adjusted.description.blocks.ram = { mode: 'hide', field: 'attribute', attributeId: '', match: 'equals', value: '' };
    const html = '<div class="g_specBox3">Grafika</div><div class="g_specBox3">RAM</div><p>Inne</p>';
    const result = applyTemplateSettings({ translations: { pl_PL: { description: html } } },
        '/api/product/shoper', adjusted, undefined, 'gaming');
    assert.doesNotMatch(result.translations.pl_PL.description, /Grafika|RAM/);
    assert.match(result.translations.pl_PL.description, /Inne/);
});

test('a component rule removes the whole PC component without removing its neighbors', () => {
    const adjusted = settings();
    adjusted.description.before.pl = '';
    adjusted.description.rules = [];
    adjusted.description.replacements = [];
    adjusted.description.blocks.cpu = { mode: 'hide', field: 'attribute', attributeId: '', match: 'equals', value: '' };
    const html = '<div class="poleasingowe_section2">' +
        '<div class="poleasingowe_boxes"><img src="/assets/cpu.png"><p>CPU</p></div>' +
        '<div class="poleasingowe_boxes"><img src="/assets/ram.png"><p>RAM</p></div></div>';
    const result = applyTemplateSettings({ translations: { pl_PL: { description: html } } },
        '/api/product/shoper', adjusted, undefined, 'pc');
    assert.doesNotMatch(result.translations.pl_PL.description, /CPU/);
    assert.match(result.translations.pl_PL.description, /RAM/);
});

test('a conditional description can be placed before generated content', () => {
    const adjusted = settings();
    adjusted.description.before.pl = '';
    adjusted.description.replacements = [];
    adjusted.description.rules[0].placement = 'before';
    const html = applyDescriptionSettings('<p>Treść główna</p>', 'pl', { attributes: { 762: 'Ryzen 5' } }, adjusted);
    assert.ok(html.indexOf('Opis procesora') < html.indexOf('Treść główna'));
});
