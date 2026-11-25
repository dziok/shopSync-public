import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { build } from 'esbuild';
import { JSDOM } from 'jsdom';
import { compileCopy, templateCopyPlugin } from '../build/template-copy.mjs';

const root = new URL('../src/', import.meta.url).pathname;
async function load(contents, resolveDir = root) {
    const result = await build({ stdin: { contents, loader:'ts', resolveDir }, bundle:true, write:false, format:'esm',
        plugins:[{ name:'vite-root', setup(b) { b.onResolve({filter:/^\/src\/templateCopy$/}, () => ({path:resolve(root,'templateCopy.ts')})); } }] });
    return import('data:text/javascript;base64,' + Buffer.from(result.outputFiles[0].contents).toString('base64'));
}
const common = "export { installTemplateCopy } from './templateCopy';";

test('office specification edits reorder complete rows without changing adjacent rows or conditions', async t => {
    const dom = new JSDOM();
    globalThis.window = dom.window;
    t.after(() => { delete globalThis.window; dom.window.close(); });
    const {installTemplateCopy, PcApiloSpecyfication, officeCatalog, rowError, previewOfficeRow} = await load(common +
        "export {PcApiloSpecyfication} from './addProduct/templates/pcTemplateNew';export * from './addProduct/officeSpecRows';");
    const args = ['SFF','6','Intel','10500','3','4','UHD','SSD','512','Kabel','Windows 11','16 GB','DDR4','DVD','USB','Obudowa'];
    const baseline = PcApiloSpecyfication(...args);
    const id = officeCatalog().find(e => e.row === 'cpu').id;
    const legacyUnit = 'pl:tekst:8ef5533f53a292ce4fff1333';
    installTemplateCopy({templates:{pc:{description:{copy:{[legacyUnit]:' GHz'}}}}});
    assert.match(PcApiloSpecyfication(...args), /3 GHz/);
    const edited = '<b>{{model}}</b>: {{rdzenie}} rdzeni <script>test</script>';
    installTemplateCopy({templates:{pc:{description:{copy:{[id]:edited,[legacyUnit]:' GHz'}}}}});
    const result = PcApiloSpecyfication(...args);
    assert.ok(result.includes('<li><b>10500</b>: 6 rdzeni </li>'));
    assert.equal(result.slice(result.indexOf('</li>')), baseline.slice(baseline.indexOf('</li>')));
    assert.match(previewOfficeRow('cpu',edited), /10500.*6 rdzeni/);
    assert.ok(rowError('cpu','{{błędne}}')); assert.ok(rowError('cpu','{{model}')); assert.equal(rowError('cpu',edited),'');
    args[7] = 'brak dysku';
    assert.match(PcApiloSpecyfication(...args), /Brak dysku w zestawie/);
    assert.doesNotMatch(PcApiloSpecyfication(...args), /Zainstalowany system/);
});

test('every active template has editable defaults without selecting a product first', async () => {
    const plugin = templateCopyPlugin();
    plugin.configResolved({root:resolve(root,'..')});
    const module = plugin.load.call({addWatchFile(){}},plugin.resolveId('virtual:listing-copy'));
    const catalog = JSON.parse(module.slice('export default '.length));
    const { ACTIVE_TEMPLATE_KEYS, getTemplateDescriptionCatalog } = await load(
        "export { ACTIVE_TEMPLATE_KEYS } from './templateSettings';export { getTemplateDescriptionCatalog } from './templateDescriptionCatalog';"
    );
    for (const key of ACTIVE_TEMPLATE_KEYS) {
        const items = catalog[key] ?? getTemplateDescriptionCatalog(key);
        assert.ok(items.some(e => e.language === 'pl'),key);
        assert.equal(new Set(items.map(e => e.id)).size, items.length,key);
    }
});

test('only literal listing text is editable, not attributes, condition inputs, product data or CSS', async () => {
    const source = 'export const render = (name, yes) => `<div class="Heading"><h2>Heading</h2><p>${name} ${yes ? "First" : "Other"}</p><style>p {color:red}</style></div>`';
    const {code,entries} = compileCopy(source, 'templates/iosTemplate.ts','ios');
    const {render,installTemplateCopy} = await load(code + '\n' + common);
    assert.deepEqual(entries.map(e=>e.original).sort(), ['First','Heading','Other']);
    const original = render('Heading',true);
    const id = text => entries.find(e=>e.original===text).id;
    installTemplateCopy({templates:{ios:{description:{copy:{[id('First')]:'<new>', [id('Heading')]:'Title'}}}}});
    assert.equal(render('Heading',true), '<div class="Heading"><h2>Title</h2><p>Heading &lt;new&gt;</p><style>p {color:red}</style></div>');
    assert.ok(render('Heading',false).includes('Heading Other'));
    installTemplateCopy(null);
    assert.equal(render('Heading',true),original);
});

test('localized option descriptions are scoped to their template and option; rich formatting survives edits', async () => {
    const dom = new JSDOM();
    globalThis.window = dom.window;
    globalThis.document = dom.window.document;
    globalThis.NodeFilter = dom.window.NodeFilter;
    try {
        const { installTemplateCopy, getTemplateDescriptionCatalog, templateDictionaries, getCpuTypeDescription } = await load(common +
            "export * from './templateDescriptionCatalog'; export { getCpuTypeDescription } from './addProduct/additionalDescriptions/pcAdditionalDescription';");
        const items = getTemplateDescriptionCatalog('pc');
        const matches = items.filter(e => e.group === 'System' && e.language === 'pl' && e.label === 'Windows 11 Home');
        assert.equal(matches.length,1);
        const [group] = matches;
        assert.ok(group.html && group.original.includes('<li'));
        assert.ok(!items.some(e => e.id.startsWith(group.id + ':część:')));
        const key = 'Klasa A';
        const original = templateDictionaries('ios').monitorVC[key];
        const before = templateDictionaries('pc').systemType['Windows 11 Home'];
        installTemplateCopy({templates:{pc:{description:{copy:{'pl:Procesor:Intel Core Ultra 7':'Custom CPU',
            'pl:Procesor:AMD Ryzen 7 PRO':'Opis nowej serii & PRO',
            'pl:RAM:Nowy RAM':'Nowy & szybki', 'cz:Dysk:Nowy dysk':'Nový disk',
            [group.id + ':część:0']:'<edited>'}}},
            ios:{description:{copy:{['pl:Stan matrycy:'+key]:'iOS only'}}}}});
        assert.equal(getCpuTypeDescription('Intel Core Ultra 7','pl'),'Custom CPU');
        assert.equal(templateDictionaries('pc').ramTypesDescriptions['Nowy RAM'], 'Nowy &amp; szybki');
        assert.equal(templateDictionaries('pc').diskTypesDescriptionsCZ['Nowy dysk'], 'Nový disk');
        assert.equal(templateDictionaries('pc').diskTypesDescriptions['Nowy dysk'], undefined);
        assert.equal(getCpuTypeDescription('AMD Ryzen 7 PRO','pl'),'Opis nowej serii &amp; PRO');
        assert.equal(getCpuTypeDescription('AMD Ryzen 7 PRO','cz'),getCpuTypeDescription('AMD Ryzen 7','cz'));
        assert.notEqual(getCpuTypeDescription('Intel Core Ultra 9','pl'),'Custom CPU');
        assert.notEqual(getCpuTypeDescription('Intel Core Ultra 7','cz'),'Custom CPU');
        assert.equal(templateDictionaries('ios').monitorVC[key],'iOS only');
        assert.equal(templateDictionaries('android').monitorVC[key], original);
        const after = templateDictionaries('pc').systemType['Windows 11 Home'];
        assert.ok(after.includes('&lt;edited&gt;'));
        const structure = html => [...new JSDOM(html).window.document.body.querySelectorAll('*')].map(e=>e.tagName);
        assert.deepEqual(structure(after),structure(before));
        installTemplateCopy({templates:{pc:{description:{copy:{
            [group.id]:'<ul class="spec"><li>Pierwszy</li><li><b>Drugi</b></li></ul><script>ignored()</script><p onclick="ignored()">Test</p>',
            ['pl:RAM:DDR4']:'<b>tekst</b>',
        }}}}});
        const dict = templateDictionaries('pc');
        assert.equal(dict.systemType['Windows 11 Home'],'<ul class="spec"><li>Pierwszy</li><li><b>Drugi</b></li></ul><p>Test</p>');
        assert.equal(dict.ramTypesDescriptions.DDR4,'&lt;b&gt;tekst&lt;/b&gt;');
        installTemplateCopy(null);
        assert.equal(templateDictionaries('pc').systemType['Windows 11 Home'],before);
    } finally {
        dom.window.close(); delete globalThis.document; delete globalThis.NodeFilter; delete globalThis.window;
    }
});

test('real generator defaults are unchanged by compilation and translations have separate keys', async (t) => {
    const dom = new JSDOM();
    globalThis.document = dom.window.document;
    t.after(() => { dom.window.close(); delete globalThis.document; });
    for (const [path,name,lang] of [['templates/monitorTemplate.ts','monitorTemplate','pl'],['templatesCZ/monitorTemplateCZ.ts','monitorTemplateCZ','cz']]) {
        const file = resolve(root, 'addProduct', path);
        const source = await readFile(file,'utf8');
        const { code, entries } = compileCopy(source,path,'monitor');
        assert.ok(entries.length > 0 && entries.every(e => e.language === lang));
        const transformed = await load(code,resolve(file,'..'));
        const original = await load('export * from "./addProduct/' + path + '";');
        const args = [...Array(19).fill('Test'), 'KVM', true,true];
        assert.equal(transformed[name](...args),original[name](...args));
    }
});
