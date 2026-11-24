import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';

const requests = [];
globalThis.__qaShoperRequests = requests;
const bundle = await build({
    entryPoints: [new URL('../src/backendQueries/addProductShoper.ts', import.meta.url).pathname],
    bundle: true, platform: 'node', format: 'esm', write: false,
    plugins: [{
        name: 'mock-shoper-api',
        setup(plugin) {
            plugin.onResolve({ filter: /^(axios|\.\.\/config)$/ }, args => ({ path: args.path, namespace: 'qa-api' }));
            plugin.onLoad({ filter: /.*/, namespace: 'qa-api' }, args => ({
                contents: args.path === 'axios'
                    ? `export default { post: async (...args) => {
                        globalThis.__qaShoperRequests.push(args);
                        return { data: 12345 };
                    }, isAxiosError: () => false };`
                    : `export const API_URL = '/api';`,
                loader: 'js',
            }));
        },
    }],
});
const { AddProductShoper } = await import(
    `data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].contents).toString('base64')}`
);

const selected = {
    producer: 17,
    SKU: 'QA-PC-1',
    name: 'Komputer wybrany przez użytkownika',
    active: false,
    description: '<p>Procesor Ryzen 5</p>',
    descriptionCZ: '<p>Ryzen 5 CZ</p>',
    descriptionSK: '<p>Ryzen 5 SK</p>',
    price: '34.99',
    stock: '2',
};

async function sentPayload(data, attributes = { 762: 'Ryzen 5' }) {
    requests.length = 0;
    const result = await AddProductShoper(data, attributes, 'Nazwa CZ', 'Nazwa SK', 6,
        { authToken: 'test-only-jwt' }, '249');
    assert.equal(result, 12345);
    assert.equal(requests.length, 1);
    assert.equal(requests[0][0], '/api/product/shoper');
    assert.equal(requests[0][2].headers.Authorization, 'Bearer test-only-jwt');
    return requests[0][1];
}

test('office PC request reflects the selected producer, name, price, stock, description and attributes', async () => {
    const payload = await sentPayload(selected);
    assert.equal(payload.producer_id, selected.producer);
    assert.equal(payload.code, selected.SKU);
    assert.equal(payload.category_id, '249');
    assert.equal(payload.translations.pl_PL.name, selected.name);
    assert.equal(payload.translations.pl_PL.description, selected.description);
    assert.equal(payload.translations.cs_CZ.description, selected.descriptionCZ);
    assert.equal(payload.translations.sk_SK.description, selected.descriptionSK);
    assert.equal(payload.stock.price, selected.price);
    assert.equal(payload.stock.stock, selected.stock);
    assert.deepEqual(payload.attributes, { 762: 'Ryzen 5' });
    assert.equal(payload.translations.pl_PL.active, false);
    assert.equal(payload.translations.cs_CZ.active, false);
    assert.equal(payload.translations.sk_SK.active, false);
});

test('changing one form value changes only its matching API field', async () => {
    const base = await sentPayload(selected);
    const cases = [
        ['name', 'Nowa nazwa', payload => payload.translations.pl_PL.name],
        ['producer', 19, payload => payload.producer_id],
        ['SKU', 'QA-PC-2', payload => payload.code],
        ['price', '35.50', payload => payload.stock.price],
        ['stock', '7', payload => payload.stock.stock],
        ['description', '<p>Procesor Ryzen 7</p>', payload => payload.translations.pl_PL.description],
        ['descriptionCZ', '<p>Ryzen 7 CZ</p>', payload => payload.translations.cs_CZ.description],
        ['descriptionSK', '<p>Ryzen 7 SK</p>', payload => payload.translations.sk_SK.description],
    ];
    for (const [field, value, read] of cases) {
        const changed = await sentPayload({ ...selected, [field]: value });
        assert.equal(read(changed), value, field);
        assert.notEqual(read(changed), read(base), field);
    }
});

test('changing an attribute changes the Shoper attribute value in the request', async () => {
    const payload = await sentPayload(selected, { 762: 'Ryzen 7' });
    assert.deepEqual(payload.attributes, { 762: 'Ryzen 7' });
});

test('an inactive form choice never becomes an active Shoper translation', async () => {
    const inactive = await sentPayload({ ...selected, active: false });
    const active = await sentPayload({ ...selected, active: true });
    for (const locale of ['pl_PL', 'cs_CZ', 'sk_SK']) {
        assert.equal(inactive.translations[locale].active, false);
        assert.equal(active.translations[locale].active, true);
    }
});
