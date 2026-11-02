import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { JSDOM } from 'jsdom';

async function load(path) {
    const bundle = await build({
        entryPoints: [new URL(`../src/addProduct/${path}`, import.meta.url).pathname],
        bundle: true, platform: 'node', format: 'esm', write: false,
    });
    return import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].contents).toString('base64')}`);
}

const templates = [
    (await load('templates/gamingTemplate.ts')).gamingTemplate,
    (await load('templatesCZ/gamingTemplateCZ.ts')).gamingTemplateCZ,
    (await load('templatesSK/gamingTemplateSK.ts')).gamingTemplateSK,
];

test('Shoper gaming descriptions omit both game-art strips when disabled', () => {
    for (const template of templates) {
        const args = Array(29).fill('');
        args[23] = false;
        const normal = new JSDOM(template(...args)).window.document;
        const disabled = new JSDOM(template(...args, true)).window.document;

        assert.equal(normal.querySelectorAll('.g_gameImg').length, 8);
        assert.equal(disabled.querySelectorAll('.g_gameImg').length, 0);
        assert.equal(disabled.querySelectorAll('img[src*="g_cpu"]').length,
            normal.querySelectorAll('img[src*="g_cpu"]').length);
    }
});
