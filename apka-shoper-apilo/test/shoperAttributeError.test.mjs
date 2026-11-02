import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import axios from 'axios';

async function load(path) {
    const bundle = await build({
        entryPoints: [new URL(`../src/backendQueries/${path}`, import.meta.url).pathname],
        bundle: true, platform: 'browser', format: 'esm', write: false,
    });
    return import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].contents).toString('base64')}`);
}

const attributes = [{ attribute_id: 913, name: 'Typ obudowy' }];
const response = {
    status: 400,
    data: {
        message: 'Shoper rejected product request',
        shoperError: { error_description: "Attribute '913' has invalid option value" },
    },
};
const error = new axios.AxiosError('Request failed with status code 400', 'ERR_BAD_REQUEST', undefined, undefined, response);

test('Shoper and API errors identify the attribute by name and retain its ID', async () => {
    const { getShoperErrorMessage } = await load('shoperErrorMessage.ts');
    const { getApiErrorMessage } = await load('apiErrorMessage.ts');
    for (const message of [
        getShoperErrorMessage(error, attributes),
        getApiErrorMessage(error, 'Nie udało się dodać produktu.', attributes),
    ]) {
        assert.match(message, /Atrybut „Typ obudowy” \(ID 913\) ma nieprawidłową wartość opcji/);
    }
    assert.match(getShoperErrorMessage(error), /Attribute '913' has invalid option value/);
});

test('unknown attribute IDs are not assigned an unrelated name', async () => {
    const { nameShoperAttributesInError } = await load('shoperAttributeError.ts');
    assert.equal(
        nameShoperAttributesInError("Attribute '913' and Attribute '315'", attributes),
        "Atrybut „Typ obudowy” (ID 913) and Attribute '315'",
    );
});
