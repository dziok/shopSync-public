import assert from 'node:assert/strict';
import test from 'node:test';
import { build } from 'esbuild';
const { outputFiles } = await build({entryPoints:['src/backendQueries/allegroOfferError.ts'], bundle:true, write:false, format:'esm', platform:'browser'});
const { allegroOfferError } = await import('data:text/javascript;base64,' + Buffer.from(outputFiles[0].contents).toString('base64'));
const fields = [{ id:'248811', name:'Marka', dictionary:[] }];
const error = errors => ({isAxiosError:true, response:{status:422, data:{errors, message:'An error has occurred'}}});

test('explains the reported brand error once without technical boilerplate', () => {
    const issue = {userMessage:'Niepoprawnie zdefininiowano values, valuesIds lub rangeValue dla parametru 248811.', message:'An error has occurred'};
    const message = allegroOfferError(error([issue,issue]), fields, {});
    assert.match(message, /„Marka” \(ID 248811\).*liście opcji/);
    assert.equal(message.split('Marka').length, 2);
    assert.doesNotMatch(message, /valuesIds|An error/);
});
test('resolves an indexed path against submitted product parameters and preserves unrelated issues', () => {
    const message = allegroOfferError(error([{path:'productSet[0].product.parameters[0].valuesIds', userMessage:'Wartość niedozwolona.'},
        {userMessage:'Niepoprawna cena.'}]), fields, { productSet:[{product:{parameters:[{id:'248811'}]}}] });
    assert.match(message, /Marka.*Wartość niedozwolona/);
    assert.match(message, /Niepoprawna cena/);
});
