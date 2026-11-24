import test from 'node:test';
import assert from 'node:assert/strict';
import React, { act, createElement as h } from 'react';
import { JSDOM } from 'jsdom';
import { build } from 'esbuild';

test('the mounted form takes a delivery, accepts late attributes and preserves operator edits', async () => {
    const dom = new JSDOM('<main></main>');
    globalThis.window = dom.window;
    globalThis.document = dom.window.document;
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    const { createRoot } = await import('react-dom/client');
    const { useForm } = await import('react-hook-form');
    const bundle = await build({
        entryPoints: [new URL('../src/useDeliveryAutofill.ts', import.meta.url).pathname],
        bundle: true, platform: 'node', format: 'esm', write: false,
        plugins: [{name:'shared-react', setup(build) {
            build.onResolve({filter:/^react$/}, () => ({path:import.meta.resolve('react'), external:true}));
        }}],
    });
    const { DeliveryContext, useDeliveryAutofill } = await import('data:text/javascript;base64,' + Buffer.from(bundle.outputFiles[0].contents).toString('base64'));
    const root = createRoot(document.querySelector('main'));
    const photos = [];
    const attachPhotos = files => photos.push(files);
    let form;
    function Template({ attrs }) {
        form = useForm();
        useDeliveryAutofill(form.setValue, form.getFieldState, attachPhotos, attrs);
        return h('input', form.register('SKU'));
    }
    const product = {
        draft:{template:'monitor',source:{SKU:'M1',Model:'Monitor A'},title:'Monitor A',price:'100,99',aiFields:[]},
        mapping:{sku:'SKU',model:'Model'},photos:[new dom.window.File(['photo'],'M1.jpg')],
    };
    const render = (item, attrs, key) => act(() => root.render(h(React.StrictMode, null,
        h(DeliveryContext.Provider,{value:item},h(Template,{attrs,key})))));
    try {
        await render(product, [], 'row-1');
        assert.equal(document.querySelector('input').value,'M1');
        assert.equal(form.getValues('price'),100.99);
        await act(() => form.setValue('price',150,{shouldDirty:true}));
        await render(product,[{attribute_id:42,type:'0',name:'Model',options:[]}],'row-1');
        assert.equal(form.getValues('attribute_42'),'Monitor A');
        assert.equal(form.getValues('price'),150);
        assert.deepEqual(photos,[product.photos]);
        await render(null, [], 'manual');
        assert.equal(document.querySelector('input').value,'');
        assert.equal(form.getValues('attribute_42'), undefined);
    } finally {
        await act(() => root.unmount());
        dom.window.close();
        delete globalThis.document;
        delete globalThis.window;
        delete globalThis.IS_REACT_ACT_ENVIRONMENT;
    }
});
