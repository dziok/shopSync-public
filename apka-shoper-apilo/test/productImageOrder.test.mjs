import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';

const bundle = await build({
    entryPoints: [new URL('../src/addProduct/productImageOrder.ts', import.meta.url).pathname],
    bundle: true, platform: 'node', format: 'esm', write: false,
});
const { appendUniqueImages, moveImageItem } = await import(
    `data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].contents).toString('base64')}`
);

const file = (name, lastModified = 1) => ({ name, size: 100, lastModified });

test('adds only new images and keeps manually chosen order', () => {
    const first = file('photo3.jpg');
    const second = file('photo2.jpg');
    const third = file('photo1.jpg');
    assert.deepEqual(appendUniqueImages([], [first, second, third]), [third, second, first]);
    assert.deepEqual(appendUniqueImages([second, first], [second, third]), [second, first, third]);
});

test('reorders files and their URLs with identical positions', () => {
    assert.deepEqual(moveImageItem(['a', 'b', 'c'], 2, 0), ['c', 'a', 'b']);
    assert.deepEqual(moveImageItem(['url-a', 'url-b', 'url-c'], 2, 0), ['url-c', 'url-a', 'url-b']);
    assert.deepEqual(moveImageItem(['a', 'b'], 4, 0), ['a', 'b']);
});
