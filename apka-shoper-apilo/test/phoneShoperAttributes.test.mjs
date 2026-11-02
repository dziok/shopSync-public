import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';

const bundle = await build({
    entryPoints: [new URL('../src/addProduct/phoneShoperAttributes.ts', import.meta.url).pathname],
    bundle: true, platform: 'node', format: 'esm', write: false,
});
const { additionalPhoneAttributes, buildPhoneShoperAttributes, findPhoneAttribute, formatPhoneMatrixGrade, getPhoneCategoryGroupIds, isPhoneEnabled, missingPhoneAttributes, phoneAttributeGroupIds, PHONE_ATTRIBUTE_GROUP_ID } = await import(
    `data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].contents).toString('base64')}`
);

const attr = (attribute_id, name, type, values = []) => ({
    attribute_id, name, type,
    options: values.map((value, option_id) => ({ option_id, value })),
});

test('uses IDs and valid option values from Shoper rather than fixed phone IDs', () => {
    const attributes = [
        attr(1001, 'System operacyjny', '2', ['iOS 18', 'iOS 19']),
        attr(1002, 'Pojemność baterii (mAh)', '0'),
        attr(1003, 'Dual SIM', '1'),
        attr(1004, 'Rozdzielczość ekranu', '2', ['1920 x 1080', '2560 x 1440']),
        attr(1005, 'Gwarancja', '2', ['12 miesięcy', '24 miesiące']),
    ];
    const result = buildPhoneShoperAttributes(attributes, {
        system: 'iOS 19', batteryCapacity: '3500', dualSim: false, resolution: '1920 x 1080',
    });
    assert.deepEqual(result, {
        1001: 'iOS 19', 1002: '3500 mAh', 1003: false,
        1004: '1920 x 1080', 1005: '24 miesiące',
    });
    assert.equal(findPhoneAttribute(attributes, 'batteryCapacity').attribute_id, 1002);
});

test('does not overwrite warranty with the new-product default during updates', () => {
    const attributes = [attr(1101, 'Gwarancja', '2', ['12 miesięcy', '24 miesiące'])];
    assert.deepEqual(buildPhoneShoperAttributes(attributes, {}, false), {});
    assert.deepEqual(buildPhoneShoperAttributes(attributes, {}), { 1101: '24 miesiące' });
});

test('rejects values absent from Shoper options before product creation', () => {
    assert.throws(() => buildPhoneShoperAttributes([
        attr(2001, 'System', '2', ['Android 15']),
    ], { system: 'Android 14' }), /System: Android 14/);
});

test('reports missing category attributes without inventing their IDs', () => {
    const missing = missingPhoneAttributes([attr(3001, 'Model', '0')]);
    assert.equal(missing.includes('model'), false);
    assert.equal(missing.includes('system'), true);
    assert.equal(missing.includes('kondycja baterii'), true);
});

test('sends battery condition for Android using the Shoper attribute type', () => {
    assert.deepEqual(buildPhoneShoperAttributes([
        attr(3201, 'Kondycja baterii', '0'),
    ], { batteryStatus: '87' }), { 3201: '87 %' });
    assert.deepEqual(buildPhoneShoperAttributes([
        attr(3202, 'Kondycja baterii', '2', ['85%', '90%']),
    ], { batteryStatus: '85%' }), { 3202: '85%' });
    assert.throws(() => buildPhoneShoperAttributes([
        attr(3202, 'Kondycja baterii', '2', ['85%', '90%']),
    ], { batteryStatus: '87%' }), /Kondycja baterii: 87%/);
});

test('includes additional Shoper attributes supplied by the dynamic form', () => {
    const result = buildPhoneShoperAttributes([
        attr(4001, 'Model', '0'),
        attr(4002, 'Kolor obudowy', '2', ['Czarny', 'Biały']),
        attr(4003, 'Czy ma ładowarkę', '1'),
    ], { model: 'iPhone X', attribute_4002: 'Biały', attribute_4003: true });
    assert.deepEqual(result, { 4001: 'iPhone X', 4002: 'Biały', 4003: true });
});

test('maps formerly local phone fields to Shoper options and avoids duplicate additional fields', () => {
    const attributes = [
        attr(5101, 'Uwagi', '0'),
        attr(5102, 'Nazwa ekranu', '2', ['Super Retina XDR', 'Retina']),
        attr(5103, 'Rodzaj karty SIM', '2', ['nanoSIM', 'eSIM']),
        attr(5105, 'Obiektyw szerokokątny', '2', ['Tak', 'Nie']),
        attr(5106, 'Teleobiektyw', '1'),
        attr(5107, 'Czujnik głębi (LIDAR)', '1'),
    ];
    assert.deepEqual(buildPhoneShoperAttributes(attributes, {
        additionalInfo: 'Rysa', screenName: 'Retina', simType: 'eSIM',
        lens_ultraWide: 'Nie', lens_tele: true, lens_lidar: false,
    }), {
        5101: 'Rysa', 5102: 'Retina', 5103: 'eSIM',
        5105: 'Nie', 5106: true, 5107: false,
    });
    assert.equal(findPhoneAttribute(attributes, 'lens_lidar').attribute_id, 5107);
    assert.equal(isPhoneEnabled('Nie'), false);
    assert.equal(isPhoneEnabled('Tak'), true);
});

test('recognizes mobile attribute names shown by Shoper and maps duplicate IDs', () => {
    const attributes = [
        attr(6101, 'Wodoszczelność', '1'),
        attr(6102, 'Czujniki', '0'),
        attr(6103, 'Aparat tył', '0'),
        attr(6104, 'Aparat przód', '0'),
        attr(6105, 'Złącze', '0'),
        attr(6106, 'Ilość pamięci RAM', '0'),
        attr(6107, 'Złącze', '0'),
    ];
    assert.equal(findPhoneAttribute(attributes, 'frontCamera')?.attribute_id, 6104);
    assert.equal(findPhoneAttribute(attributes, 'backCamera')?.attribute_id, 6103);
    assert.equal(findPhoneAttribute(attributes, 'waterproof')?.attribute_id, 6101);
    assert.deepEqual(additionalPhoneAttributes(attributes).map(item => item.name), ['Czujniki']);
    assert.deepEqual(buildPhoneShoperAttributes(attributes, {
        waterproof: true, frontCamera: '12', backCamera: '48', connection: 'USB-C', ramAmount: '8 GB',
    }), {
        6101: true, 6103: '48 Mpx', 6104: '12 Mpx', 6105: 'USB-C', 6106: '8 GB', 6107: 'USB-C',
    });
});

test('keeps screen and case condition separate in mobile attribute group 16', () => {
    const attributes = [
        attr(1601, 'Stan matrycy', '2', ['Klasa A', 'Klasa B']),
        attr(1602, 'Stan obudowy', '2', ['Klasa A', 'Klasa B']),
        attr(1603, 'Stan', '2', ['Nowy', 'Używany']),
    ];
    assert.equal(PHONE_ATTRIBUTE_GROUP_ID, 16);
    assert.equal(findPhoneAttribute(attributes, 'matrixGrade')?.attribute_id, 1601);
    assert.equal(findPhoneAttribute(attributes, 'caseGrade')?.attribute_id, 1602);
    assert.deepEqual(buildPhoneShoperAttributes(attributes, {
        matrixGrade: 'Klasa B', caseGrade: 'Klasa A',
    }), { 1601: 'Klasa B', 1602: 'Klasa A' });
    assert.deepEqual(additionalPhoneAttributes(attributes).map(item => item.name), ['Stan']);
    assert.equal(formatPhoneMatrixGrade('Klasa B', 'Widoczne rysy'), 'Klasa B (Widoczne rysy)');
    assert.equal(formatPhoneMatrixGrade('Inna wartość'), 'Inna wartość');
});

test('loads group 16 alongside category and optional supplemental groups', () => {
    assert.deepEqual(phoneAttributeGroupIds([21, 16, 22]), [16, 21, 22]);
    assert.deepEqual(phoneAttributeGroupIds([], '35'), [16, 35]);
    assert.deepEqual(phoneAttributeGroupIds([], ''), [16]);
});

test('reads category groups from Shoper list and detail response shapes', () => {
    assert.deepEqual(getPhoneCategoryGroupIds({
        translations: { pl_PL: { attribute_groups: ['12'] } },
        attribute_groups: [{ attribute_group_id: 13 }],
    }), [12, 13]);
    assert.deepEqual(getPhoneCategoryGroupIds({
        translations: [{ locale: 'pl_PL', attribute_groups: [44] }],
    }), [44]);
    assert.deepEqual(getPhoneCategoryGroupIds({ translations: { pl_PL: { name: 'Telefony' } } }), []);
});
