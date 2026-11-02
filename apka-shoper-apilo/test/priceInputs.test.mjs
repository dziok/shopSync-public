import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import { JSDOM } from 'jsdom';

const templates = [
    'addCustomProduct', 'addCpu', 'addLaptop', 'addDamagedLaptop',
    'addGamingPC', 'addPhoneIOS', 'addPhoneAndroid', 'addMonitor',
    'addPc', 'addLaptopNew',
];

test('active price fields allow two decimal places', () => {
    let checked = 0;
    for (const name of templates) {
        const path = new URL(`../src/addProduct/${name}.tsx`, import.meta.url);
        const source = ts.createSourceFile(name, readFileSync(path, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
        const visit = (node) => {
            if (ts.isJsxSelfClosingElement(node) && node.tagName.getText(source) === 'TextField') {
                const attribute = (key) => node.attributes.properties.find(
                    property => ts.isJsxAttribute(property) && property.name.text === key
                );
                const label = attribute('label')?.initializer;
                if (label && ts.isStringLiteral(label) && /^(?:Cena|cena|Cena Allegro)$/.test(label.text)) {
                    checked++;
                    assert.equal(attribute('type')?.initializer?.text, 'number', `${name}: price input type`);
                    const inputProps = attribute('inputProps')?.initializer;
                    assert.ok(inputProps && ts.isJsxExpression(inputProps) && ts.isObjectLiteralExpression(inputProps.expression), `${name}: inputProps`);
                    const step = inputProps.expression.properties.find(
                        property => ts.isPropertyAssignment(property) && property.name.getText(source) === 'step'
                    );
                    assert.equal(step?.initializer?.text, '0.01', `${name}: price step`);
                }
            }
            ts.forEachChild(node, visit);
        };
        visit(source);
    }
    assert.equal(checked, 11);
});

test('a price of 34.99 passes native step validation', () => {
    const input = new JSDOM('<input type="number" step="0.01">').window.document.querySelector('input');
    input.value = '34.99';
    assert.equal(input.validity.stepMismatch, false);
    input.value = '34.999';
    assert.equal(input.validity.stepMismatch, true);
});
