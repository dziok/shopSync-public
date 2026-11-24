import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { build } from 'esbuild';
import { JSDOM } from 'jsdom';
import ts from 'typescript';

const dom = new JSDOM('<!doctype html><html><body></body></html>');
globalThis.document = dom.window.document;
globalThis.NodeFilter = dom.window.NodeFilter;

async function load(relativePath) {
    const path = new URL(`../src/${relativePath}`, import.meta.url).pathname;
    const bundle = await build({ entryPoints: [path], bundle: true, platform: 'node', format: 'esm', write: false });
    const module = await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].contents).toString('base64')}`);
    return { path, module };
}

function parameterNames(path, exportName) {
    const source = ts.createSourceFile(path, readFileSync(path, 'utf8'), ts.ScriptTarget.Latest, true);
    let params;
    function visit(node) {
        if (ts.isVariableDeclaration(node) && node.name.getText(source) === exportName &&
            node.initializer && ts.isArrowFunction(node.initializer)) {
            params = node.initializer.parameters.map(param => ({
                name: param.name.getText(source),
                type: param.type?.getText(source) ?? '',
            }));
        }
        ts.forEachChild(node, visit);
    }
    visit(source);
    assert.ok(params, `Missing ${exportName} in ${path}`);
    return params;
}

const cases = [
    { key: 'pc', path: 'addProduct/templates/pcTemplateNew.ts', name: 'pcTemplateNew', fields: ['cpuModel', 'ramAmount', 'system'] },
    { key: 'gaming', path: 'addProduct/templates/gamingTemplate.ts', name: 'gamingTemplate', fields: ['gpuName', 'ramName', 'diskName'] },
    { key: 'monitor', path: 'addProduct/templates/monitorTemplate.ts', name: 'monitorTemplate', fields: ['model', 'resolution', 'refreshRate'] },
    { key: 'laptop-new', path: 'addProduct/templates/laptopTemplateNew.ts', name: 'LaptopTemplateNew', fields: ['cpuModel', 'ramAmount', 'battery'] },
    { key: 'ios', path: 'addProduct/templates/iosTemplate.ts', name: 'IOSTemplate', fields: ['screenName', 'resolution', 'matrixGrade'] },
    { key: 'android', path: 'addProduct/templates/androidTemplate.ts', name: 'AndroidTemplate', fields: ['screenName', 'resolution', 'matrixGrade'] },
    { key: 'damaged-laptop', path: 'addProduct/templates/damagedLaptops.ts', name: 'damagedLaptopTemplate', fields: ['model', 'marka', 'battery'] },
];

const { module: settingsModule } = await load('templateSettings.ts');
const { ACTIVE_TEMPLATE_KEYS, applyTemplateSettings } = settingsModule;

test('every active template has a description or custom-product contract', () => {
    assert.deepEqual(new Set(cases.map(item => item.key).concat('custom')), new Set(ACTIVE_TEMPLATE_KEYS));
});

for (const item of cases) {
    const { path, module } = await load(item.path);
    const template = module[item.name];
    const params = parameterNames(path, item.name);
    const args = params.map(({ name, type }) => type === 'boolean' ? false : type.includes('[]') ? [] : `QA_BASE_${name}`);
    const render = values => {
        dom.window.document.body.innerHTML = template(...values);
        return dom.window.document.body.textContent.replace(/\s+/g, ' ');
    };

    test(`${item.key}: changing selected form fields changes the generated description`, () => {
        const base = render(args);
        assert.ok(base.trim(), `${item.key}: empty description`);
        assert.doesNotMatch(base, /\b(?:undefined|NaN)\b/, `${item.key}: invalid interpolation`);
        for (const field of item.fields) {
            const index = params.findIndex(param => param.name === field);
            assert.ok(index >= 0, `${item.key}: missing ${field}`);
            const changed = [...args];
            changed[index] = `QA_CHANGED_${field}`;
            const output = render(changed);
            assert.notEqual(output, base, `${item.key}: ${field} did not affect description`);
            assert.ok(output.includes(`QA_CHANGED_${field}`), `${item.key}: new ${field} absent from description`);
            assert.ok(!base.includes(`QA_CHANGED_${field}`));
        }
    });

    test(`${item.key}: every directly rendered text parameter follows the selected value`, context => {
        const base = render(args);
        let checked = 0;
        for (const [index, param] of params.entries()) {
            const baseMarker = new RegExp(`QA_BASE_${param.name}(?![A-Za-z0-9_])`);
            if (param.type !== 'string' || !baseMarker.test(base)) continue;
            const changed = [...args];
            changed[index] = `QA_CHANGED_${param.name}`;
            const output = render(changed);
            assert.ok(output !== base, `${item.key}: ${param.name} did not change description`);
            assert.match(output, new RegExp(`QA_CHANGED_${param.name}(?![A-Za-z0-9_])`), `${item.key}: ${param.name} has stale value`);
            assert.ok(!baseMarker.test(output), `${item.key}: ${param.name} retained the old value`);
            checked++;
        }
        assert.ok(checked >= item.fields.length, `${item.key}: too few rendered parameters checked (${checked})`);
        context.diagnostic(`${checked} directly rendered text parameters checked`);
    });

    const booleanParams = params.map((param, index) => ({ ...param, index })).filter(param => param.type === 'boolean');
    if (booleanParams.length) {
        test(`${item.key}: checkbox options change the generated description`, context => {
            const base = render(args);
            for (const { name, index } of booleanParams) {
                const changed = [...args];
                changed[index] = true;
                assert.ok(render(changed) !== base, `${item.key}: ${name} did not affect description`);
            }
            context.diagnostic(`${booleanParams.length} checkbox options checked`);
        });
    }
}

test('custom template settings change the payload sent to Shoper without changing user input', () => {
    const settings = {
        shoper: { categoryId: null, gaugeId: null, deliveryId: null, gfxId: null, pkwiu: '' },
        apilo: { tax: null, status: null },
        allegro: { shippingRatesName: '', returnPolicyName: '', warrantyName: '' },
        description: { before: { pl: 'QA Wstęp', cz: '', sk: '' }, after: { pl: '', cz: '', sk: '' }, rules: [], replacements: [], blocks: {} },
    };
    const original = { code: 'QA-CUSTOM', translations: { pl_PL: { name: 'Użytkownik wybrał nazwę', description: '<p>Treść użytkownika</p>', active: false } } };
    const result = applyTemplateSettings(original, '/api/product/shoper', settings, undefined, 'custom');
    assert.match(result.translations.pl_PL.description, /QA Wstęp/);
    assert.match(result.translations.pl_PL.description, /Treść użytkownika/);
    assert.equal(result.translations.pl_PL.name, original.translations.pl_PL.name);
    assert.equal(result.translations.pl_PL.active, false);
    assert.equal(original.translations.pl_PL.description, '<p>Treść użytkownika</p>');
});
