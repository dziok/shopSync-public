import assert from 'node:assert/strict';
import test from 'node:test';
import { build } from 'esbuild';

const { outputFiles } = await build({ stdin: { contents: `
    export * from './addProduct/gamingTitles';
    export * from './addProduct/productTitleTranslations';
    export * from './backendQueries/shoperErrorMessage';
`, resolveDir: new URL('../src/', import.meta.url).pathname }, bundle: true, write: false, format: 'esm', platform: 'browser' });
const { prepareGamingTitles, createTitleResolver, shoperSaveProgress, getShoperErrorMessage } = await import('data:text/javascript;base64,' + Buffer.from(outputFiles[0].contents).toString('base64'));

test('uses imported translations only for their own title and shares concurrent work', async () => {
    const calls = [];
    const translate = async s => { calls.push(s); return 'Auto ' + s; };
    const resolver = createTitleResolver(translate, translate);
    resolver.seed('A', 'Ruční název', '');
    assert.deepEqual(await resolver.ensure('A'), { pl:'A', cs:'Ruční název', sk:'Auto A' });
    const [first, second] = await Promise.all([resolver.ensure('B'), resolver.ensure('B')]);
    assert.equal(first.cs, 'Auto B');
    assert.deepEqual(first, second);
    assert.deepEqual(calls, ['A', 'B', 'B']);
});

test('partial save reports created product ID and downstream details', () => {
    const progress = shoperSaveProgress();
    progress.created(123);
    assert.match(progress.error(new Error('Brak zdjęcia')), /ID 123.*Nie dodawaj.*Brak zdjęcia/);
});

test('translates the submitted title without a blur event and rejects missing translations', async () => {
    const cz = async s => 'CZ ' + s;
    const sk = async s => 'SK ' + s;
    assert.deepEqual(await prepareGamingTitles(' Import ', cz, sk), { pl: 'Import', cs: 'CZ Import', sk: 'SK Import' });
    await assert.rejects(prepareGamingTitles('Import', cz, async () => '  '), /słowacki/);
    await assert.rejects(prepareGamingTitles('  ', cz, sk), /polski tytuł/);
});

test('shows Shoper field error instead of generic HTTP 400 on translation update', () => {
    const detail = "Wartość pola 'name' jest niepoprawna: Pole wymagane";
    const message = getShoperErrorMessage({isAxiosError:true, response:{data:{message:'Request failed with status code 400',
        errors:{error:'invalid_request',error_description:detail}}}});
    assert.ok(message.includes(detail));
    assert.ok(!message.includes('status code 400'));
});
