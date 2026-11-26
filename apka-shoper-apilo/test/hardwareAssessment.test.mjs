import {test} from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {JSDOM} from 'jsdom';
import {fileURLToPath} from 'node:url';

test('assessment publication is optional, escaped and repeatable', async () => {
    const bundle = await build({entryPoints:[fileURLToPath(new URL('../src/addProduct/hardwareAssessment.ts',import.meta.url))],
        bundle:true,format:'esm',write:false});
    const {shoperAssessmentDescription, formatAssessment} = await import('data:text/javascript;base64,'+
        Buffer.from(bundle.outputFiles[0].contents).toString('base64'));
    const rows = [{key:'games',label:'Gry i rozrywka',score:null,reason:'Brak GPU <img src=x>'}];
    const base = '<p>Specyfikacja produktu</p>';
    assert.equal(shoperAssessmentDescription(base,rows,false),base);
    assert.equal(formatAssessment([],'allegro'),'');
    const published = shoperAssessmentDescription(base,rows,true);
    assert.equal(JSDOM.fragment(published).querySelector('.ss-gaming'),null);
    for (const [theme,weight] of [['laptop-new','500'],['damaged-laptop','400']]) {
        const chart = JSDOM.fragment(shoperAssessmentDescription(base,rows,true,theme)).querySelector('.ss-assessment-chart');
        assert.equal(chart.style.getPropertyValue('--ss-title-weight'),weight);
    }
    const gaming = shoperAssessmentDescription(published,rows,true,'gaming');
    assert.equal(JSDOM.fragment(gaming).querySelectorAll('.hardware-assessment .ss-gaming').length,1);
    assert.equal(shoperAssessmentDescription(gaming,rows,true,'gaming'),gaming);
    const features = '<div class="g_specBox2"><!--shopsync:gaming-assessment--></div><p>GPU</p>';
    const embedded = shoperAssessmentDescription(features,rows,true,'gaming');
    assert.ok(JSDOM.fragment(embedded).querySelector('.g_specBox2 > .hardware-assessment'));
    assert.equal(shoperAssessmentDescription(embedded,rows,true,'gaming'),embedded);
    assert.equal(formatAssessment(rows,'allegro','gaming'),formatAssessment(rows,'allegro'));
    assert.equal(shoperAssessmentDescription(published,rows,true),published);
    assert.equal(shoperAssessmentDescription(published,[],false),published);
    const html = formatAssessment(rows,'allegro');
    const doc = JSDOM.fragment(html);
    assert.match(doc.textContent,/Brak danych/);
    assert.ok([...doc.querySelectorAll('*')].every(el => ['H2','P','B'].includes(el.tagName)));
    const chart = JSDOM.fragment(shoperAssessmentDescription(base,[{...rows[0],score:7}, ...rows],true));
    const [rated, unknown] = chart.querySelectorAll('details');
    assert.equal(chart.querySelector('.ss-axis'),null);
    assert.equal(chart.querySelectorAll('h2').length,1);
    assert.equal(rated.open,false);
    assert.equal(rated.querySelector('.ss-bar').style.width,'70%');
    assert.equal(rated.querySelector('.ss-plot + .ss-score').textContent,'7/10');
    assert.equal(unknown.querySelector('.ss-score'),null);
    assert.match(rated.querySelector('.ss-reason').textContent,/Brak GPU <img src=x>/);
    assert.equal(chart.querySelector('img'),null);
    assert.equal(unknown.querySelector('.ss-bar'),null);
    assert.match(unknown.querySelector('summary').textContent,/Brak danych/);
});
