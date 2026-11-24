import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';

test('selecting an office PC fills only Allegro state even with incomplete catalog data', async () => {
    const bundle = await build({ entryPoints: [new URL('../src/addProduct/allegroComponents/selectAllegroProduct.tsx', import.meta.url).pathname], bundle: true, format: 'esm', write: false });
    const { handleSelectAllegroProduct } = await import('data:text/javascript;base64,' + Buffer.from(bundle.outputFiles[0].contents).toString('base64'));
    const product = { id: '123', name: 'Nowy tytuł', parameters: [{ name: 'Model', values: ['PC'], options: { identifiesProduct: true } }] };
    handleSelectAllegroProduct({
        product, pcNewParameteres: [{ name: 'Model' }],
        setSelectedProductId: id => assert.equal(id, product.id),
        setSelectedProduct: value => assert.equal(value, product),
        setLockedParams: names => assert.deepEqual([...names], ['Model']),
        setFormData: fields => assert.deepEqual(fields, { Model: 'PC' }),
        setValue: () => assert.fail('Selection must not change the Shoper form'),
    });
});
