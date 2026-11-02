import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';

const bundle = await build({
    entryPoints: [new URL('../src/addProduct/phoneShoperOffer.ts', import.meta.url).pathname],
    bundle: true, platform: 'node', format: 'esm', write: false,
});
const { phoneDescriptionSignature, phoneOfferAttributeEntries, phoneOfferFormAttributes, phoneOfferGroupIds, phoneOfferProduct } = await import(
    `data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].contents).toString('base64')}`
);

const attr = (attribute_id, name, type, options = []) => ({
    attribute_id, name, type,
    options: options.map((value, option_id) => ({ option_id: option_id + 10, value })),
});

test('hydrates mobile fields from grouped Shoper attributes', () => {
    const product = phoneOfferProduct({ product: {
        category_id: 314,
        attributes: {
            16: { 101: 'Klasa B', 102: 'Klasa A' },
            47: { 103: { value: '87 %' }, 104: '10', 105: 1, 106: 'Inna wartość' },
        },
    } });
    const attributes = [
        attr(101, 'Stan matrycy', '2', ['Klasa A', 'Klasa B']),
        attr(102, 'Stan obudowy', '2', ['Klasa A', 'Klasa B']),
        attr(103, 'Kondycja baterii', '0'),
        attr(104, 'Rodzaj karty SIM', '2', ['nanoSIM', 'eSIM']),
        attr(105, 'Wodoszczelność', '1'),
        attr(106, 'Kolor', '0'),
    ];
    assert.deepEqual(phoneOfferGroupIds(product), [16, 47]);
    assert.equal(phoneOfferAttributeEntries(product).length, 6);
    assert.deepEqual(phoneOfferFormAttributes(product, attributes), {
        matrixGrade: 'Klasa B', caseGrade: 'Klasa A', batteryStatus: '87',
        simType: 'nanoSIM', waterproof: true, attribute_106: 'Inna wartość',
    });
});

test('hydrates flat array attributes and keeps select option values', () => {
    const product = phoneOfferProduct({
        attributes: [
            { attribute_id: 201, value: { option_id: 11 } },
            { attribute_id: 202, values: [{ value: '48 Mpx' }] },
            { attribute_id: 203, value: false },
        ],
    });
    assert.deepEqual(phoneOfferFormAttributes(product, [
        attr(201, 'System operacyjny', '2', ['Android 14', 'Android 15']),
        attr(202, 'Aparat tył', '0'),
        attr(203, 'Wodoszczelność', '1'),
    ]), { system: 'Android 15', backCamera: '48', waterproof: false });
});

test('description signature changes only with template inputs', () => {
    const before = phoneDescriptionSignature({ matrixGrade: 'Klasa A', price: 100 });
    assert.equal(phoneDescriptionSignature({ matrixGrade: 'Klasa A', price: 200 }), before);
    assert.notEqual(phoneDescriptionSignature({ matrixGrade: 'Klasa B', price: 100 }), before);
});
