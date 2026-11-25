import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
const result = await build({
    entryPoints: ['src/addProduct/formAiFields.ts'],
    bundle: true,
    write: false,
    format: 'esm',
});
const { formFields, validateSuggestion } = await import(
    'data:text/javascript;base64,' + Buffer.from(result.outputFiles[0].contents).toString('base64')
);
test('mobile fields map to the bound phone field; ambiguous select and arbitrary text are rejected', () => {
    const attrs = [
        { attribute_id: 7, name: 'Aparat przód', type: '0' },
        { attribute_id: 8, name: 'Klasa', type: '2', options: [{ value: 'A' }, { value: 'B' }, { value: 'B' }] },
    ];
    const fields = formFields('ios', attrs, []);
    assert.equal(fields.find((f) => f.id === 's:7').key, 'frontCamera');
    const grade = fields.find((f) => f.id === 's:8');
    for (const label of ['A+', 'B', '<script>']) assert.equal(validateSuggestion(grade, [label]), undefined);
    assert.equal(validateSuggestion(grade, ['A']), 'A');
});
test('phone specs can fill visible technical fields without a title, SKU or complete Shoper schema', () => {
    for (const template of ['ios', 'android']) {
        const fields = formFields(template, [{attribute_id: 88, name:'System operacyjny', type:'2',
            options:[{value:'iOS 16'}]}], []);
        const systems = fields.filter(f => f.key === 'system');
        assert.equal(systems.length, 1);
        assert.equal(systems[0].id, 's:88');
        assert.equal(validateSuggestion(systems[0], ['iOS 16']), 'iOS 16');
        assert.equal(validateSuggestion(systems[0], ['iOS 99']), undefined);
        assert.equal(validateSuggestion(fields.find(f => f.key === 'dualSim'), ['true']), true);
        assert.equal(validateSuggestion(fields.find(f => f.key === 'simType'), ['Nano SIM / eSIM']), 'Nano SIM / eSIM');
        assert.ok(!fields.some(f => f.key === 'warranty'));
    }
});
test('catalog validation preserves explicit false and multiselect, never changes locked fields', () => {
    const fields = formFields(
        'pc',
        [{ attribute_id: 4, name: 'Dotyk', type: '1' }],
        [
            { id: '7', name: 'RAM', type: 'integer' },
            {
                id: '8',
                name: 'Porty',
                dictionary: [{ value: 'HDMI' }, { value: 'USB' }],
                restrictions: { multipleChoices: true },
            },
        ],
        (name) => name === 'RAM',
    );
    const val = (id, ...values) =>
        validateSuggestion(
            fields.find((f) => f.id === id),
            values,
        );
    assert.equal(val('s:4', 'false'), false);
    assert.equal(val('s:4', 'brak danych'), undefined);
    assert.equal(val('a:7', '32'), undefined);
    assert.deepEqual(val('a:8', 'HDMI', 'USB'), ['HDMI', 'USB']);
    assert.equal(val('a:8', 'HDMI', 'inne'), undefined);
    assert.equal(val('s:price', '34,99'), '34.99');
    assert.equal(val('s:stock', '1.5'), undefined);
});
