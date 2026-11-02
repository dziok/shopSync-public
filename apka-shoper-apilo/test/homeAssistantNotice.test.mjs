import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { JSDOM } from 'jsdom';

globalThis.document = new JSDOM('').window.document;

async function load(path) {
    const bundle = await build({
        entryPoints: [new URL(`../src/addProduct/${path}`, import.meta.url).pathname],
        bundle: true, platform: 'node', format: 'esm', write: false,
    });
    return import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].contents).toString('base64')}`);
}

const descriptions = await load('additionalDescriptions/pcAdditionalDescription.ts');
const { pcTemplateNew } = await load('templates/pcTemplateNew.ts');
const { pcTemplateCZ } = await load('templatesCZ/pcTemplateCZ.ts');
const { pcTemplateSK } = await load('templatesSK/pcTemplateSK.ts');

test('Home Assistant Shoper descriptions include the support notice only for HAOS', () => {
    const cases = [
        { template: pcTemplateNew, systems: descriptions.systemType, systemIndex: 10, descriptionIndex: 19, heading: 'Ważne – wsparcie techniczne' },
        { template: pcTemplateCZ, systems: descriptions.systemTypeCZ, systemIndex: 9, descriptionIndex: 18, heading: 'Důležité – technická podpora' },
        { template: pcTemplateSK, systems: descriptions.systemTypeSK, systemIndex: 9, descriptionIndex: 18, heading: 'Dôležité – technická podpora' },
    ];
    for (const { template, systems, systemIndex, descriptionIndex, heading } of cases) {
        const args = Array(32).fill('');
        if (template !== pcTemplateSK) args[template === pcTemplateNew ? 14 : 13] = [];
        args[systemIndex] = 'Home Assistant';
        args[descriptionIndex] = systems['Home Assistant'];
        const homeAssistant = template(...args);
        assert.ok(homeAssistant.includes(heading));
        assert.match(homeAssistant, /Home Assistant OS \(HAOS\)/);
        assert.doesNotMatch(homeAssistant, /64bit/);
        const preview = new JSDOM(homeAssistant).window.document;
        assert.equal(preview.querySelectorAll('.haos_notice').length, 1);
        assert.equal(preview.querySelectorAll('.haos_notice .poleasingowe_h3').length, 1);
        assert.equal(preview.querySelectorAll('.haos_notice .poleasingowe_p2').length, 4);
        assert.match(homeAssistant, /\.haos_notice \.poleasingowe_p2 \{/);

        args[systemIndex] = 'Windows 11 Home';
        args[descriptionIndex] = systems['Windows 11 Home'];
        const windows = template(...args);
        assert.ok(!windows.includes(heading));
        assert.equal(new JSDOM(windows).window.document.querySelectorAll('.haos_notice').length, 0);
    }
});

test('Polish support notice contains the supplied scope of responsibility', () => {
    const notice = descriptions.homeAssistantSupportNotice;
    assert.match(notice, /Nie świadczymy usług konfiguracji, wdrażania ani wsparcia technicznego/);
    assert.match(notice, /integracja urządzeń, instalacja dodatków/);
    assert.match(notice, /samodzielna konfiguracja HAOS wymaga odpowiedniej wiedzy technicznej/);
    assert.doesNotMatch(notice, /class=|<div|<style/);
});
