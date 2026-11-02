import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';

const bundle = await build({
    entryPoints: [new URL('../src/addProduct/gamingProductTargets.ts', import.meta.url).pathname],
    bundle: true, platform: 'node', format: 'esm', write: false,
});
const { getCreatedShoperProductId, getExactApiloProductId } = await import(
    `data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].contents).toString('base64')}`
);

test('Shoper update targets only a valid ID returned by the current create request', () => {
    assert.equal(getCreatedShoperProductId(123), 123);
    assert.equal(getCreatedShoperProductId({ product_id: '456' }), 456);
    assert.equal(getCreatedShoperProductId({ data: { id: 789 } }), 789);
    for (const response of [null, {}, { id: 0 }, { id: 'NaN' }, { id: '1.2' }]) {
        assert.throws(() => getCreatedShoperProductId(response), /ID nowo utworzonego produktu/);
    }
});

test('Apilo replacement requires exactly one product with the submitted SKU', () => {
    assert.equal(getExactApiloProductId({ totalCount: 2, products: [
        { id: 12, sku: 'OLD' }, { id: 34, sku: 'NEW' },
    ] }, 'NEW'), 34);
    assert.equal(getExactApiloProductId({ totalCount: 1, products: [
        { id: 12, sku: 'OLD' },
    ] }, 'NEW'), null);
    assert.throws(() => getExactApiloProductId({ totalCount: 2, products: [
        { id: 12, sku: 'NEW' }, { id: 34, sku: 'NEW' },
    ] }, 'NEW'), /niejednoznaczne/);
    assert.throws(() => getExactApiloProductId({ totalCount: 1, products: [
        { id: 12 },
    ] }, 'NEW'), /SKU produktu/);
    assert.throws(() => getExactApiloProductId({ totalCount: 2, products: [
        { id: 12, sku: 'NEW' },
    ] }, 'NEW'), /niejednoznaczne/);
});
