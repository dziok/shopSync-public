import assert from 'node:assert/strict';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';

test('read-only Allegro preview renders offer items in order without changing the submission', async () => {
    const vite = await createServer({
        configFile: false, server: { middlewareMode: true, hmr: false, watch: null },
        optimizeDeps: { noDiscovery: true }, esbuild: { jsx: 'automatic' },
    });
    const dom = new JSDOM('');
    try {
        const { AllegroOfferPreview } = await vite.ssrLoadModule('/src/addProduct/allegroComponents/AllegroDescriptionEditor.tsx');
        globalThis.window = dom.window;
        const photo = 'https://example.org/pc.jpg';
        const description = { sections: [
            { items: [{ type: 'TEXT', content: '<h1>Komputer</h1>' }] },
            { items: [{ type: 'IMAGE', url: photo }, { type: 'TEXT', content: '<ul><li>SSD</li></ul>' }] },
            { items: [{ type: 'IMAGE' }] },
        ] };
        const original = structuredClone(description);
        const render = () => JSDOM.fragment(renderToStaticMarkup(React.createElement(AllegroOfferPreview, { description })));
        const preview = render();
        assert.deepEqual([...preview.querySelectorAll('h1,img,li')].map(el => el.textContent || el.getAttribute('src')), ['Komputer', photo, 'SSD']);
        assert.match(preview.textContent, /Brak zdjęcia/);
        assert.equal(preview.querySelector('button,input,textarea'), null);
        assert.deepEqual(description, original);
        description.sections[0].items[0].content = '<h1>Nowy tytuł</h1>';
        assert.equal(render().querySelector('h1').textContent, 'Nowy tytuł');
        description.sections = [];
        assert.match(render().textContent, /Brak sekcji/);
    } finally {
        delete globalThis.window;
        dom.window.close();
        await vite.close();
    }
});
