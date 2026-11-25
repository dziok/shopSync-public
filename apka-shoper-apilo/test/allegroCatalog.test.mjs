import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';

const bundle = await build({ stdin: { contents: `
export * from './src/allegroParameters/catalog';
export * from './src/addProduct/allegroComponents/buildOfferParameters';`, resolveDir: process.cwd() },
    bundle: true, format: 'esm', write: false, define: { 'process.env.NODE_ENV': '"production"' } });
const { resolveCatalog, compareCatalog, withCatalogLabels, categoryIds, buildOfferParameters } =
    await import('data:text/javascript;base64,' + Buffer.from(bundle.outputFiles[0].contents).toString('base64'));

const fixture = () => ({ categoryId: '486', parameters: structuredClone(resolveCatalog('pc')) });
test('same API category keeps the two PC templates distinct, including hidden IDs and local aliases', () => {
    const snapshot = fixture();
    const builtIn = resolveCatalog('gaming');
    const merged = resolveCatalog('gaming', snapshot);
    assert.deepEqual(merged.map(p => p.id), builtIn.map(p => p.id));
    for (const [i, p] of merged.entries()) {
        const before = builtIn[i];
        assert.equal(p.shoper, before.shoper);
        assert.equal(p.type, before.type);
        assert.deepEqual(p.dictionary?.map(d => [d.id, d.value]), before.dictionary?.map(d => [d.id, d.value]));
    }
    assert.equal(merged.some(p => p.id === '206902'), false);
    assert.equal(resolveCatalog('pc', snapshot).some(p => p.id === '206902'), true);
    assert.deepEqual(buildOfferParameters({ 'Typ dysku twardego': 'NVMe (M.2)' }, true, merged),
        [{ id: '201769', valuesIds: ['201769_208989'] }]);
});

test('new fields, choices and offer routing use the selected API schema; reset leaves the original intact', () => {
    const snapshot = fixture();
    const series = snapshot.parameters.find(p => p.name === 'Seria');
    series.dictionary.push({ id: '206182_99999999', value: 'Nowa seria' });
    snapshot.parameters.push({ id: '99999999', name: 'Nowe pole', type: 'string', options: { describesProduct: false } });
    const merged = resolveCatalog('gaming', snapshot);
    const data = { Seria: 'Nowa seria', 'Nowe pole': 'Test' };
    assert.deepEqual(buildOfferParameters(data, true, merged), [{ id: series.id, valuesIds: ['206182_99999999'] }]);
    assert.deepEqual(buildOfferParameters(data, false, merged), [{ id: '99999999', values: ['Test'] }]);
    const diff = compareCatalog(resolveCatalog('gaming'), merged);
    assert.equal(diff.conflicts.length, 0);
    assert.ok(diff.changes.some(s => s.includes('Nowe pole')));
    assert.ok(diff.changes.some(s => s.includes('nowe opcje: 1')));
    assert.ok([...diff.details.values()].flat().some(s => s.includes('Nowa seria (206182_99999999)')));
    assert.equal(resolveCatalog('gaming').some(p => p.id === '99999999'), false);
});

test('retired choices cannot be submitted and incompatible fields are flagged', () => {
    const snapshot = fixture();
    const disk = snapshot.parameters.find(p => p.id === '201769');
    disk.dictionary = disk.dictionary.filter(d => d.id !== '201769_208989');
    disk.dictionary.push({ id: '201769_99999999', value: disk.dictionary[0].value });
    const series = snapshot.parameters.find(p => p.name === 'Seria');
    series.type = 'integer';
    const current = resolveCatalog('gaming'), merged = resolveCatalog('gaming', snapshot);
    assert.deepEqual(buildOfferParameters({ 'Typ dysku twardego': 'NVMe (M.2)' }, true, merged), []);
    assert.ok(compareCatalog(current, merged).conflicts.some(s => s.includes('Seria')));
    assert.ok(compareCatalog(current, merged).conflicts.some(s => s.includes('dwa różne ID')));
});

test('catalog selection imports by Allegro ID using template labels without changing the source product', () => {
    const snapshot = fixture();
    const brand = snapshot.parameters.find(p => p.name === 'Marka');
    brand.name = 'Nazwa po zmianie';
    const id = '248811_1135161';
    const product = { parameters: [{ id: brand.id, name: brand.name, valuesIds: [id] }] };
    const imported = withCatalogLabels(product, resolveCatalog('gaming', snapshot)).parameters[0];
    assert.equal(imported.name, 'Marka');
    assert.deepEqual(imported.valuesLabels, ['Natec']);
    assert.equal(product.parameters[0].valuesLabels, undefined);
    const offline = resolveCatalog('gaming');
    const local = withCatalogLabels(product, offline).parameters[0];
    assert.deepEqual(buildOfferParameters({ [local.name]: local.valuesLabels[0] }, true, offline),
        [{ id: '248811', valuesIds: [id] }]);
    assert.deepEqual(buildOfferParameters({ Marka: 'Nieznana opcja' }, true, offline), []);
});

test('all four templates have offline defaults and ignore snapshots from a different category', () => {
    for (const key of Object.keys(categoryIds)) {
        assert.ok(resolveCatalog(key).length > 0);
        assert.equal(resolveCatalog(key, { categoryId: 'other', parameters: [] }), resolveCatalog(key));
    }
});
