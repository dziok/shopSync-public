import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';

const requests = [];
const notifications = [];
globalThis.__shoperUpdateRequests = requests;
globalThis.__shoperUpdateNotifications = notifications;

const mocks = {
    axios: `export default {
        put: async (...args) => {
            globalThis.__shoperUpdateRequests.push(args);
            return { data: { updated: true } };
        },
        isAxiosError: () => false,
    };`,
    'react-toastify': `export const toast = {
        success: (message) => globalThis.__shoperUpdateNotifications.push(['success', message]),
        warning: (message) => globalThis.__shoperUpdateNotifications.push(['warning', message]),
        error: (message) => globalThis.__shoperUpdateNotifications.push(['error', message]),
    };`,
    '../config': `export const API_URL = 'http://localhost/api';`,
    './apiErrorMessage': `export const getApiErrorMessage = (error) => error.message;`,
};

const bundle = await build({
    entryPoints: [new URL('../src/backendQueries/updateProductShoper.ts', import.meta.url).pathname],
    bundle: true,
    platform: 'node',
    format: 'esm',
    write: false,
    plugins: [{
        name: 'mock-api',
        setup(plugin) {
            plugin.onResolve({ filter: /^(axios|react-toastify|\.\.\/config|\.\/apiErrorMessage)$/ }, (args) => ({
                path: args.path, namespace: 'mock-api',
            }));
            plugin.onLoad({ filter: /.*/, namespace: 'mock-api' }, (args) => ({
                contents: mocks[args.path], loader: 'js',
            }));
        },
    }],
});
const { UpdateProductShoper } = await import(
    `data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].contents).toString('base64')}`
);

const input = {
    productId: 28345,
    basePayload: { code: 'PC-1' },
    translations: { pl_PL: { name: 'Komputer', description: 'Opis', active: true } },
    finalAttributes: { 991: 'test1\ntest2\ntest3\ntst123' },
    props: { authToken: 'test-token' },
};

test('writes form attributes after translations and verifies before reporting success', async () => {
    requests.length = 0;
    notifications.length = 0;
    await UpdateProductShoper({
        ...input,
        verify: async () => {
            assert.equal(requests.length, 3);
            assert.deepEqual(requests[2][1], { attributes: input.finalAttributes });
            assert.equal(notifications.length, 0);
        },
    });
    assert.deepEqual(requests.map(([, payload]) => payload), [
        input.basePayload,
        { translations: { pl_PL: input.translations.pl_PL } },
        { attributes: input.finalAttributes },
    ]);
    assert.ok(requests.every(([url]) => url.endsWith('/product/28345')));
    assert.deepEqual(notifications, [['success', 'Produkt w Shoperze został zaktualizowany.']]);
});

test('does not report success when Shoper readback differs from the form', async () => {
    requests.length = 0;
    notifications.length = 0;
    const previousConsoleError = console.error;
    console.error = () => {};
    try {
        await assert.rejects(
            UpdateProductShoper({ ...input, verify: async () => { throw new Error('Wartość nie została zapisana'); } }),
            /Wartość nie została zapisana/,
        );
    } finally {
        console.error = previousConsoleError;
    }
    assert.equal(requests.length, 3);
    assert.deepEqual(notifications, []);
});
