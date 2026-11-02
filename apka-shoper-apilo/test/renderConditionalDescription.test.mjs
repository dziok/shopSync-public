import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { JSDOM } from 'jsdom';

const bundle = await build({
    entryPoints: [new URL('../src/addProduct/templates/renderConditionalDescription.ts', import.meta.url).pathname],
    bundle: true, platform: 'node', format: 'esm', write: false,
});
const { renderConditionalDescription } = await import(
    `data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].contents).toString('base64')}`
);

const { document } = new JSDOM('').window;
globalThis.document = document;

test('omits unavailable description sections instead of hiding them with CSS', () => {
    const output = renderConditionalDescription(`
        <div class="false">Hidden flag</div>
        <div class="laptop_HDD">SSD description</div>
        <div class="display_nie">Touchscreen</div>
        <div class="poleasingoweCaseType_Tower">AIO section</div>
        <div class="true">Visible feature</div>
        <div style="display: none !important">Hidden inline</div>
        <div data-omit="none !important">Hidden conditional</div>
        <div data-omit="">Visible conditional</div>
        <div style="display: block">Visible inline</div>
        <div style="display: flex; gap: 1rem">Layout</div>
    `);
    const fragment = document.createElement('template');
    fragment.innerHTML = output;
    assert.equal(fragment.content.querySelectorAll('div').length, 4);
    assert.match(output, /Visible feature/);
    assert.match(output, /Visible inline/);
    assert.match(output, /Visible conditional/);
    assert.match(output, /display: flex/);
    assert.doesNotMatch(output, /Hidden flag|SSD description|Touchscreen|AIO section|Hidden inline|Hidden conditional|data-omit|display: block/);
});

test('keeps AIO and visible mobile options', () => {
    const output = renderConditionalDescription('<div class="poleasingoweCaseType_All in One">AIO</div><span class="true">5G</span><span class="false">NFC</span>');
    assert.match(output, /AIO/);
    assert.match(output, /5G/);
    assert.doesNotMatch(output, /NFC|class="true"/);
});

async function loadTemplate(path, name) {
    const output = await build({
        entryPoints: [new URL(`../src/addProduct/templates/${path}`, import.meta.url).pathname],
        bundle: true, platform: 'node', format: 'esm', write: false,
    });
    const module = await import(`data:text/javascript;base64,${Buffer.from(output.outputFiles[0].contents).toString('base64')}`);
    return module[name];
}

test('generated mobile description omits unchecked features', async () => {
    const android = await loadTemplate('androidTemplate.ts', 'AndroidTemplate');
    const description = android('', false, false, false, false, false, '', '', '', '', '', false, false, false, '', '48', '12');
    assert.doesNotMatch(description, /Ultraszerokątny|Ładowanie bezprzewodowe|class="false"|display: none/);
    assert.match(description, /Wi-Fi/);
});

test('generated PC description omits unavailable AIO, disk and notes sections', async () => {
    const pc = await loadTemplate('pcTemplate.ts', 'pcTemplate');
    const values = Array(31).fill('');
    values[5] = 'Tower';
    values[7] = 'Brak';
    values[9] = 'Brak';
    values[15] = 'none';
    const description = pc(...values);
    assert.doesNotMatch(description, /Specyfikacja konstrukcji AIO|<[^>]+class="poleasingowe_boxes disk_Brak"|uwagi:|display: none/);
    values[5] = 'All in One';
    assert.match(pc(...values), /Specyfikacja konstrukcji AIO/);
});
