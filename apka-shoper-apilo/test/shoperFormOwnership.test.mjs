import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import ts from 'typescript';

for (const [component, formId, allegroField] of [
    ['addMonitor', 'monitor-shoper-form', 'AllegroMonitorParameters'],
    ['addGamingPC', 'gaming-shoper-form', 'ResponsibleProducerSelect'],
]) {
    test(`${component}: Shoper submit excludes the Allegro panel`, () => {
        const file = readFileSync(new URL(`../src/addProduct/${component}.tsx`, import.meta.url), 'utf8');
        const ast = ts.createSourceFile('template.tsx', file, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
        const controls = [];
        function visit(node, owner) {
            if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node)) {
                const tag = node.openingElement ?? node;
                const prop = name => tag.attributes.properties.find(p => p.name?.getText() === name)?.initializer?.text;
                const name = tag.tagName.getText();
                if (name === 'form') owner = prop('id') || 'anonymous';
                controls.push({ name, owner: prop('form') ?? owner, type: prop('type') });
            }
            ts.forEachChild(node, child => visit(child, owner));
        }
        visit(ast, undefined);
        assert.ok(controls.some(c => c.name === 'form' && c.owner === formId));
        assert.ok(controls.some(c => c.type === 'submit' && c.owner === formId));
        assert.ok(controls.some(c => c.name === 'TextField' && c.owner === formId));
        assert.ok(controls.some(c => c.name === allegroField && !c.owner));
    });
}
