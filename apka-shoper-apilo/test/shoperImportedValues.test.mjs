import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';

const bundle = await build({
    entryPoints: [new URL('../src/addProduct/shoperImportedValues.ts', import.meta.url).pathname],
    bundle: true, platform: 'node', format: 'esm', write: false,
});
const { shoperEnabled, shoperFieldWasProvided, shoperImportedAttributeNames, readShoperProductAttributes } = await import(
    `data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].contents).toString('base64')}`
);

test('explicit false and zero are imported, missing checkbox values are not', () => {
    assert.equal(shoperFieldWasProvided(false), true);
    assert.equal(shoperFieldWasProvided(0), true);
    assert.equal(shoperFieldWasProvided('0'), true);
    assert.equal(shoperFieldWasProvided({ value: false }), true);
    assert.equal(shoperFieldWasProvided({ value: 0 }), true);
    assert.equal(shoperFieldWasProvided(undefined), false);
    assert.equal(shoperFieldWasProvided(null), false);
    assert.equal(shoperFieldWasProvided(''), false);
    assert.equal(shoperFieldWasProvided({ value: null }), false);
});

test('reads false values from Shoper without treating string zero as enabled', () => {
    assert.equal(shoperEnabled('0'), false);
    assert.equal(shoperEnabled(false), false);
    assert.equal(shoperEnabled(0), false);
    assert.equal(shoperEnabled('1'), true);
});

test('marks only attributes with values supplied by Shoper', () => {
    assert.deepEqual(shoperImportedAttributeNames([
        [123, false], [124, 0], [125, { value: false }], [126, null], [127, ''],
    ]), ['attribute_123', 'attribute_124', 'attribute_125']);
});

test('imports text attributes from the Shoper product list response', () => {
    const result = readShoperProductAttributes({
        list: [
            { attribute_id: 913, value: 'All in One' },
            { attribute_id: 1400, value: 'Dwa procesory\nZasilacz 1000 W' },
        ],
    });
    assert.deepEqual(result, {
        entries: [[913, 'All in One'], [1400, 'Dwa procesory\nZasilacz 1000 W']],
        groupIds: [],
    });
});

test('continues to import grouped Shoper attributes', () => {
    assert.deepEqual(readShoperProductAttributes({ 47: { 913: 'Tower', 1400: 'Dwa procesory' } }), {
        entries: [[913, 'Tower'], [1400, 'Dwa procesory']],
        groupIds: [47],
    });
});
