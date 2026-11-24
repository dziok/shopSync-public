import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import Papa from 'papaparse';

const bundle = await build({ entryPoints: [new URL('../src/bulkImport.ts', import.meta.url).pathname], bundle: true, platform: 'node', format: 'esm', write: false });
const { defaultMapping, makeDrafts, validateDraft } = await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].contents).toString('base64')}`);

const csv = `SKU,Grade,POLA_DODATKOWE,Chassis,Manufacturer,Model,Processor,RAM,DisplaySize,Resolution
HPC131,A,"Minor scratches, complete drive cages",SFF,HP,ELITEDESK 705 G5,RYZEN 5,8 GB,,
DCM461,A,"Stand - fine scratches, 0-2 pixels",,DELL,E2218HN,,,22,1920x1080
IPHONE792,A,,PHONE,APPLE,IPHONE 13,,,6.1,
HPC131,A,,SFF,HP,ELITEDESK 705 G5,RYZEN 5,8 GB,,`;

test('CSV parser preserves quoted commas and maps mixed delivery templates', () => {
    const parsed = Papa.parse(csv, { header: true, skipEmptyLines: true });
    assert.deepEqual(parsed.errors, []);
    assert.equal(parsed.data[0].POLA_DODATKOWE, 'Minor scratches, complete drive cages');
    const mapping = defaultMapping(parsed.meta.fields);
    const drafts = makeDrafts(parsed.data, mapping);
    assert.deepEqual(drafts.map(draft => draft.template), ['pc', 'monitor', 'ios', 'pc']);
    assert.ok(drafts[0].issues.includes('Powtórzone SKU w pliku'));
    assert.ok(drafts[1].issues.includes('Brak ceny'));
});

test('review catches a title inconsistent with source model and invalid price', () => {
    const source = { SKU: 'X1', Manufacturer: 'DELL', Model: 'E2218HN', DisplaySize: '22', Resolution: '1920x1080' };
    const mapping = defaultMapping(Object.keys(source));
    const draft = { source, template: 'monitor', title: 'Monitor innego modelu', price: '0', issues: [], aiFields: [], aiIssues: [] };
    assert.ok(validateDraft(draft, mapping).includes('Tytuł nie zawiera modelu z CSV'));
    assert.ok(validateDraft(draft, mapping).includes('Nieprawidłowa cena'));
    assert.ok(validateDraft({ ...draft, template: 'ios' }, mapping).some(issue => issue.includes('szablon')));
});
