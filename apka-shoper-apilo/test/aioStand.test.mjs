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

const templates = [
    { path: 'templates/pcTemplateNew.ts', name: 'pcTemplateNew', count: 32, caseIndex: 6, portsIndex: 14, label: 'Podstawka AIO', values: ['oryginalna', 'zastępcza', 'bez podstawki'] },
    { path: 'templatesCZ/pcTemplateCZ.ts', name: 'pcTemplateCZ', count: 31, caseIndex: 5, portsIndex: 13, label: 'Stojan AIO', values: ['originální', 'náhradní', 'bez stojanu'] },
    { path: 'templatesSK/pcTemplateSK.ts', name: 'pcTemplateSK', count: 30, caseIndex: 5, label: 'Stojan AIO', values: ['originálna', 'náhradná', 'bez stojana'] },
];

test('office PC descriptions describe every AIO stand option only for AIO', async () => {
    for (const config of templates) {
        const template = (await load(config.path))[config.name];
        const args = Array(config.count).fill('');
        if (config.portsIndex !== undefined) args[config.portsIndex] = [];
        args[config.caseIndex] = 'All in One';

        assert.ok(!template(...args, '', '').includes(config.label), config.path);
        for (const [index, value] of ['Oryginalna', 'Zastępcza', 'Brak'].entries()) {
            const html = template(...args, '', value);
            const sections = [...new JSDOM(html).window.document.querySelectorAll('#mainContainer > .poleasingowe_section')];
            assert.ok(sections.length >= 2, config.path);
            assert.ok(!sections[0].textContent.includes(config.label), `${config.path}: ${value} in general information`);
            assert.ok(sections[1].textContent.includes(config.label), `${config.path}: ${value} in AIO section`);
            assert.ok(sections[1].textContent.includes(config.values[index]), `${config.path}: ${value}`);
        }

        args[config.caseIndex] = 'SFF';
        assert.ok(!template(...args, '', 'Brak').includes(config.label), config.path);
    }
});

test('Allegro AIO specification includes the stand only when selected', async () => {
    const { PcApiloAioSpecyfication } = await load('templates/pcTemplateNew.ts');
    const args = Array(7).fill('');
    assert.ok(!PcApiloAioSpecyfication(...args).includes('Podstawka AIO'));
    assert.match(PcApiloAioSpecyfication(...args, 'Brak'), /Podstawka AIO:.*bez podstawki/);
});
