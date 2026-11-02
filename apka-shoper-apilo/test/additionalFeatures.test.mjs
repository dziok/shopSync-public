import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { JSDOM } from 'jsdom';

globalThis.document = new JSDOM('').window.document;

async function load(path) {
    const bundle = await build({
        entryPoints: [new URL(`../src/addProduct/${path}`, import.meta.url).pathname],
        bundle: true, platform: 'node', format: 'esm', write: false,
    });
    return import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].contents).toString('base64')}`);
}

const features = await load('additionalFeatures.ts');
const portGroups = await load('pcPortGroups.ts');
const pcTemplates = [
    { path: 'templates/pcTemplateNew.ts', name: 'pcTemplateNew', args: 32, ports: 14 },
    { path: 'templatesCZ/pcTemplateCZ.ts', name: 'pcTemplateCZ', args: 31, ports: 13 },
    { path: 'templatesSK/pcTemplateSK.ts', name: 'pcTemplateSK', args: 30 },
];
const monitorTemplates = [
    { path: 'templates/monitorTemplate.ts', name: 'monitorTemplate', heading: 'Funkcje dodatkowe' },
    { path: 'templatesCZ/monitorTemplateCZ.ts', name: 'monitorTemplateCZ', heading: 'Další funkce' },
    { path: 'templatesSK/monitorTemplateSK.ts', name: 'monitorTemplateSK', heading: 'Ďalšie funkcie' },
];

test('splits one feature per line and escapes user HTML', () => {
    assert.deepEqual(features.splitAdditionalFeatures(' Dwa procesory\r\n\n Zasilacz 1000 W '), ['Dwa procesory', 'Zasilacz 1000 W']);
    assert.equal(features.renderAdditionalFeatureItems('<script>x</script>\nZasilacz & złącza'), '<li>&lt;script&gt;x&lt;/script&gt;</li><li>Zasilacz &amp; złącza</li>');
});

test('resolves the Shoper attribute by name without a hard-coded ID', () => {
    const attributes = [
        { attribute_id: 101, name: 'Uwagi' },
        { attribute_id: 991, name: ' DODATKOWE   CECHY ' },
    ];
    assert.equal(features.findAdditionalFeaturesAttribute(attributes)?.attribute_id, 991);
    assert.equal(features.findAdditionalFeaturesAttribute([{ attribute_id: 102, name: 'Dodatkowa informacja' }]), undefined);
});

test('imports additional features from the attribute instead of stale description text', () => {
    const oldDescription = 'test1\ntest2\ntest3';
    const changedAttribute = 'test1test2test3jhnbh';
    assert.equal(features.resolveImportedAdditionalFeatures([[991, changedAttribute]], 991, oldDescription), changedAttribute);
    assert.equal(features.resolveImportedAdditionalFeatures([[991, { value: changedAttribute }]], 991, oldDescription), changedAttribute);
    assert.equal(features.resolveImportedAdditionalFeatures([[991, '']], 991, oldDescription), '');
    assert.equal(features.resolveImportedAdditionalFeatures([], 991, oldDescription), oldDescription);
});

test('translates each feature separately, retaining source if translation fails', async () => {
    const result = await features.translateAdditionalFeatures('Dwa procesory\nZasilacz 1000 W', async (line) =>
        line === 'Dwa procesory' ? 'Dva procesory' : '');
    assert.equal(result, 'Dva procesory\nZasilacz 1000 W');
});

test('office PC templates show additional features separately from notes in PL, CZ and SK', async () => {
    for (const { path, name, args: count, ports } of pcTemplates) {
        const template = (await load(path))[name];
        const args = Array(count).fill('');
        if (ports !== undefined) args[ports] = [];
        let html = template(...args);
        assert.equal(new JSDOM(html).window.document.querySelectorAll('.pc_extra_features').length, 0, path);
        html = template(...args, 'Dwa procesory\nZasilacz 1000 W');
        const preview = new JSDOM(html).window.document;
        assert.deepEqual([...preview.querySelectorAll('.pc_extra_features li')].map((item) => item.textContent), ['Dwa procesory', 'Zasilacz 1000 W'], path);
        assert.ok(!preview.querySelector('.pc_spec_grid')?.textContent?.includes('Dwa procesory'), path);
        assert.equal(features.readAdditionalFeaturesFromDescription(html, '.pc_extra_features'), 'Dwa procesory\nZasilacz 1000 W');
    }
});

test('office PC descriptions keep case, motherboard and GPU ports in separate rows', async () => {
    const groups = portGroups.createPcPortGroups(
        ['2 x USB 3.0', 'Jack 3.5 mm'],
        '["2 x USB 3.0", "RJ-45"]',
        ['DisplayPort 1.2'],
    );
    const labels = [
        ['Złącza obudowy', 'Złącza płyty głównej', 'Złącza karty graficznej'],
        ['Konektory skříně', 'Konektory základní desky', 'Konektory grafické karty'],
        ['Konektory skrine', 'Konektory základnej dosky', 'Konektory grafickej karty'],
    ];
    for (const [index, { path, name, args: count, ports }] of pcTemplates.entries()) {
        const template = (await load(path))[name];
        const args = Array(count).fill('');
        args[ports ?? 13] = groups;
        const preview = new JSDOM(template(...args)).window.document;
        const rows = index === 2
            ? [...preview.querySelectorAll('li')].filter((item) => labels[index].some((label) => item.textContent.includes(label)))
            : [...preview.querySelectorAll('.pc_spec_grid dt')]
                .filter((item) => labels[index].includes(item.textContent.trim()));
        assert.equal(rows.length, 3, path);
        assert.deepEqual(rows.map((item) => item.textContent.trim().replace(/:.*/, '')), labels[index], path);
        const valuesByGroup = rows.map((item) => index === 2 ? item.textContent : item.nextElementSibling.textContent);
        assert.match(valuesByGroup[0], /Jack 3\.5 mm/, path);
        assert.ok(!valuesByGroup[0].includes('RJ-45'), path);
        assert.match(valuesByGroup[1], /RJ-45/, path);
        assert.ok(!valuesByGroup[1].includes('DisplayPort'), path);
        assert.match(valuesByGroup[2], /DisplayPort 1\.2/, path);
        assert.equal(preview.body.textContent.split('2 x USB 3.0').length - 1, 2, path);
    }

    const onlyCase = portGroups.createPcPortGroups(['USB-C'], '', '');
    const args = Array(32).fill('');
    args[14] = onlyCase;
    const html = (await load('templates/pcTemplateNew.ts')).pcTemplateNew(...args);
    const preview = new JSDOM(html).window.document;
    const labelsInGrid = [...preview.querySelectorAll('.pc_spec_grid dt')].map((item) => item.textContent.trim());
    assert.ok(labelsInGrid.includes('Złącza obudowy'));
    assert.ok(!labelsInGrid.includes('Złącza płyty głównej'));
    assert.ok(!labelsInGrid.includes('Złącza karty graficznej'));
});

test('monitor templates show optional functions apart from condition and specification', async () => {
    for (const { path, name, heading } of monitorTemplates) {
        const template = (await load(path))[name];
        const args = Array(19).fill('');
        let html = template(...args);
        assert.ok(!html.includes(heading), path);
        html = template(...args, 'KVM\nUSB hub');
        const preview = new JSDOM(html).window.document;
        const headingNode = [...preview.querySelectorAll('.monitors_p')].find((node) => node.textContent?.includes(heading));
        assert.ok(headingNode, path);
        assert.deepEqual([...headingNode.nextElementSibling.querySelectorAll('li')].map((item) => item.textContent), ['KVM', 'USB hub'], path);
        assert.equal(features.readAdditionalFeaturesFromDescription(html, '.monitor_extra_features'), 'KVM\nUSB hub');
    }
});

test('Allegro monitor description creates a dedicated optional section', async () => {
    const { buildMonitorAllegroDescription } = await load('templatesAllegro/monitorAllegroDescription.ts');
    const input = Object.fromEntries([
        'producer', 'model', 'name', 'visualCondition', 'caseCondition', 'stand', 'resolution', 'diagonal',
        'panelType', 'refreshRate', 'responseTime', 'brightness', 'contrast', 'connectors', 'hdr', 'pivot', 'additionalInfo',
    ].map((key) => [key, '']));
    input.frame = false;
    input.design = false;
    const withoutFeatures = buildMonitorAllegroDescription(input);
    assert.ok(!withoutFeatures.description.sections.some((section) => section.id === 'monitor-extra-features'));
    const withFeatures = buildMonitorAllegroDescription({ ...input, extraFeatures: 'KVM\nUSB <hub>' });
    const section = withFeatures.description.sections.find((item) => item.id === 'monitor-extra-features');
    assert.ok(section);
    assert.match(section.items[0].content, /<li>KVM<\/li><li>USB &lt;hub&gt;<\/li>/);
});

test('monitor Shoper specifications list speakers only when selected', async () => {
    const labels = ['Głośniki: wbudowane', 'Reproduktory: vestavěné', 'Reproduktory: vstavané'];
    for (const [index, { path, name }] of monitorTemplates.entries()) {
        const template = (await load(path))[name];
        const args = Array(19).fill('');
        const without = new JSDOM(template(...args, '', false)).window.document;
        const withSpeakers = new JSDOM(template(...args, '', true)).window.document;
        const specificationItems = (document) => {
            const heading = [...document.querySelectorAll('.monitors_p')].find((node) =>
                /Specyfikacja|Specifikace|Špecifikácie/.test(node.textContent ?? ''));
            return [...heading.nextElementSibling.querySelectorAll('li')].map((item) => item.textContent.trim());
        };
        assert.ok(!specificationItems(without).includes(labels[index]), path);
        assert.equal(specificationItems(withSpeakers).filter((item) => item === labels[index]).length, 1, path);
    }
});

test('Allegro monitor specification lists built-in speakers only when selected', async () => {
    const { buildMonitorAllegroDescription } = await load('templatesAllegro/monitorAllegroDescription.ts');
    const input = Object.fromEntries([
        'producer', 'model', 'name', 'visualCondition', 'caseCondition', 'stand', 'resolution', 'diagonal',
        'panelType', 'refreshRate', 'responseTime', 'brightness', 'contrast', 'connectors', 'hdr', 'pivot', 'additionalInfo',
    ].map((key) => [key, '']));
    input.frame = false;
    input.design = false;
    const specification = (speakers) => buildMonitorAllegroDescription({ ...input, speakers })
        .description.sections.find((section) => section.id === 'monitor-specification')
        ?.items.find((item) => item.type === 'TEXT')?.content ?? '';
    assert.ok(!specification(false).includes('Głośniki'));
    assert.match(specification(true), /Głośniki: wbudowane/);
});
