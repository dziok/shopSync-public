import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';

const bundle = await build({
    entryPoints: [new URL('../src/addProduct/additionalDescriptions/pcAdditionalDescription.ts', import.meta.url).pathname],
    bundle: true, platform: 'node', format: 'esm', write: false,
});
const { getCpuTypeDescription } = await import(
    `data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].contents).toString('base64')}`
);

test('office PC descriptions resolve AMD A-series names and model numbers in every language', () => {
    for (const language of ['pl', 'cz', 'sk']) {
        for (const series of ['A4', 'A8', 'A10', 'A12']) {
            const expected = getCpuTypeDescription(`AMD ${series}`, language);
            assert.ok(expected.includes(`AMD ${series}`), `${language}: ${series}`);
            assert.equal(getCpuTypeDescription(series, language), expected);
            assert.equal(getCpuTypeDescription(`amd ${series}-7800`, language), expected);
            assert.equal(getCpuTypeDescription(`AMD ${series} 7800`, language), expected);
        }
    }
});

test('other AMD processors retain the generic description', () => {
    const fallback = getCpuTypeDescription('AMD unknown', 'pl');
    assert.ok(fallback.includes('Procesor AMD'));
    assert.equal(getCpuTypeDescription('AMD A14-7800', 'pl'), fallback);
});
