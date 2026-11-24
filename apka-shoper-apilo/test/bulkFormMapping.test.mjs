import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
const bundle = await build({ entryPoints: [new URL('../src/bulkFormMapping.ts', import.meta.url).pathname], bundle: true, platform: 'node', format: 'esm', write: false });
const { deliveryFields, assignDeliveryPhotos } = await import('data:text/javascript;base64,' + Buffer.from(bundle.outputFiles[0].contents).toString('base64'));
const mapping = { sku: 'SKU', manufacturer: 'Manufacturer', model: 'Model', condition: 'Grade', price: '' };
const product = (template, source, aiFields = []) => ({ draft: { template, source, title: 'Test', price: '349,99', aiFields }, mapping, photos: [] });
const attr = (attribute_id, name, options) => ({ attribute_id, name, type: options ? '2' : '0', options: options?.map((value, option_id) => ({ value, option_id })) ?? [] });

test('delivery fills the actual office PC fields without inventing select options', () => {
    const p = product('pc', { SKU:'HPC1', Manufacturer:'HP', Chassis:'Tower Slim', Processor:'CORE I5-12500', RAM:'16 GB (2 x 8 GB DDR4)', Storage1_Info:'256 GB NVME', 'Optical test result':'Fail' }, [
        {name:'Wielkość pamięci RAM',value:'64 GB'}, {name:'Kolor',value:'czarny'}, {name:'active',value:'true'},
    ]);
    const { values, skipped } = deliveryFields(p, [
        attr(766,'Wielkość pamięci RAM',['8 GB','16 GB','64 GB']), attr(763,'Typ pamięci RAM',['DDR4']), attr(774,'Pojemność dysku'),
        attr(913,'Typ obudowy',['Tiny','Tower']), attr(761,'Kolor',['Czarny']), attr(771,'Model procesora'), attr(762,'Seria',['Intel Core i5']),
    ]);
    assert.deepEqual(values,{SKU:'HPC1', name:'Test', price:349.99, stock:1, active:false, attribute_766:'16 GB', attribute_763:'DDR4', attribute_774:'256 GB', attribute_761:'Czarny', attribute_771:'12500', attribute_762:'Intel Core i5'});
    assert.ok(skipped.includes('Typ obudowy: Tower Slim'));
    assert.ok(skipped.includes('Optical test result: Fail'));
});

test('iPhone draft uses mobile form names and data from the current row only', () => {
    const attributes = [attr(10,'Model telefonu'),attr(11,'Kondycja baterii (%)'),attr(12,'Przekątna ekranu',['6.1"']),attr(13,'Stan matrycy')];
    const a = deliveryFields(product('ios',{SKU:'I1', Model:'iPhone 13', '%Battery':'91', DisplaySize:'6.1', Grade:'A'}), attributes).values;
    assert.equal(a.model,'iPhone 13'); assert.equal(a.category,'314'); assert.equal(a.batteryStatus,'91'); assert.equal(a.diagonal,'6.1"');
    assert.equal(a.matrixGrade,undefined);
    const b = deliveryFields(product('ios',{SKU:'I2',Model:'iPad Air'}), attributes).values;
    assert.equal(b.category,'331'); assert.equal(b.batteryStatus,undefined);
});

test('Core Ultra series and model are separate office PC fields with localized descriptions', async () => {
    const descriptions = await build({ entryPoints: [new URL('../src/addProduct/additionalDescriptions/pcAdditionalDescription.ts', import.meta.url).pathname], bundle: true, platform: 'node', format: 'esm', write: false });
    const { getCpuTypeDescription } = await import('data:text/javascript;base64,' + Buffer.from(descriptions.outputFiles[0].contents).toString('base64'));
    for (const [tier, model] of [[5, '245K'], [7, '265K'], [9, undefined]]) {
        const series = 'Intel Core Ultra ' + tier;
        const source = { Processor: series + (model ? ' Processor ' + model : '') };
        const { values } = deliveryFields(product('pc', source), [attr(762,'Seria procesora',[series]), attr(771,'Model procesora')]);
        assert.equal(values.attribute_762, series);
        assert.equal(values.attribute_771, model);
        for (const locale of ['pl','cz','sk']) assert.ok(getCpuTypeDescription(series, locale).includes(series));
    }
});

test('photo assignment uses SKU boundaries and rejects duplicates and unknown names', () => {
    const files = ['PC-12_01.jpg','PC-123.jpg','duplicate.jpg','random.jpg'].map(name=>({ name, type:'image/jpeg' }));
    const {assigned, unmatched} = assignDeliveryPhotos(files,['PC','PC-12','Duplicate','DUPLICATE','PC-123']);
    assert.deepEqual(assigned, {1:[files[0]],4:[files[1]]});
    assert.deepEqual(unmatched, ['duplicate.jpg','random.jpg']);
});

test('office PC storage keeps the combined Shoper option and has a description in each language', async () => {
    const descriptions = await build({ entryPoints: [new URL('../src/addProduct/additionalDescriptions/pcAdditionalDescription.ts', import.meta.url).pathname], bundle: true, platform: 'node', format: 'esm', write: false });
    const dictionaries = await import('data:text/javascript;base64,' + Buffer.from(descriptions.outputFiles[0].contents).toString('base64'));
    const options = ['EMMC + SSD', 'EMMC + SSD (m2)', 'EMMC + M.2 NVME'];
    for (const option of options) {
        const form = deliveryFields(product('pc', { Storage1_Info: '256 GB ' + option }), [attr(773, 'Typ dysku twardego', ['SSD', ...options])]);
        assert.equal(form.values.attribute_773, option);
        for (const locale of ['', 'CZ', 'SK']) {
            const text = dictionaries['diskTypesDescriptions' + locale][option];
            assert.match(text, /eMMC/);
            assert.match(text, option.includes('NVME') ? /NVMe/ : option.includes('m2') ? /M\.2/ : /SSD/);
        }
    }
});
