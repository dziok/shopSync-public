import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';

const bundle = await build({
    entryPoints: [new URL('../src/addProduct/allegroComponents/importShoperAttribute.ts', import.meta.url).pathname],
    bundle: true, platform: 'node', format: 'esm', write: false,
});
const { resolveImportedShoperAttribute, resolveShoperSelectValue } = await import(
    `data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].contents).toString('base64')}`
);

const select = (options) => ({ type: '2', options: options.map((value, option_id) => ({ value, option_id: option_id + 1 })) });

test('imports only actual Shoper select options', () => {
    const attribute = select(['Klasa A', 'Klasa A-', 'Klasa B']);
    assert.equal(resolveImportedShoperAttribute(attribute, 'klasa a'), 'Klasa A');
    assert.equal(resolveImportedShoperAttribute(attribute, 'Klasa C'), undefined);
    assert.equal(resolveImportedShoperAttribute(attribute, '2'), undefined);
});

test('matches safe formatting differences without accepting a different option', () => {
    assert.equal(resolveImportedShoperAttribute(select(['1920 x 1080']), '1920 × 1080 px'), '1920 x 1080');
    assert.equal(resolveImportedShoperAttribute(select(['60 Hz', '75 Hz']), '60'), '60 Hz');
    assert.equal(resolveImportedShoperAttribute(select(['256 GB', '512 GB']), '1 TB'), undefined);
    assert.equal(resolveImportedShoperAttribute(select(['15,6″']), '15.6"'), '15,6″');
    assert.equal(resolveImportedShoperAttribute(select(['Biały']), 'Bialy'), 'Biały');
});

test('maps checkboxes and text without inventing select values', () => {
    assert.equal(resolveImportedShoperAttribute({ type: '1', options: [] }, 'nie'), false);
    assert.equal(resolveImportedShoperAttribute({ type: '1', options: [] }, 'unknown'), undefined);
    assert.equal(resolveImportedShoperAttribute({ type: '0', options: [] }, ['USB-C', 'HDMI']), 'USB-C, HDMI');
    assert.equal(resolveImportedShoperAttribute(select(['Tak', 'Nie']), true), 'Tak');
});

test('Shoper select imports accept only available options, including option IDs', () => {
    const caseType = select(['Tiny', 'SFF', 'Tower', 'All in One']);
    assert.equal(resolveShoperSelectValue(caseType, 'Tower Slim'), undefined);
    assert.equal(resolveShoperSelectValue(caseType, { value: 'Tower Slim' }), undefined);
    assert.equal(resolveShoperSelectValue(caseType, 'tower'), 'Tower');
    assert.equal(resolveShoperSelectValue(caseType, { option_id: 4 }), 'All in One');
    assert.equal(resolveShoperSelectValue(caseType, { option_id: 99 }), undefined);
    assert.equal(resolveShoperSelectValue(caseType, '3'), 'Tower');
});
