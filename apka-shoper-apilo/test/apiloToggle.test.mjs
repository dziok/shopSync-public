import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

const templates = [
    'addPc', 'addLaptopNew', 'addMonitor', 'addCustomProduct', 'addDamagedLaptop',
    'addLaptop', 'addPhoneIOS', 'addPhoneAndroid', 'addGamingPC', 'addCpu',
];

const apiloEndpoint = /\/product\/apilo(?:Productslist|ProductDelete)?|\/product-image\/apilo|\/product\/attributes/;

test('every product template guards Apilo writes and SKU replacement with the checkbox', () => {
    for (const template of templates) {
        const path = new URL(`../src/addProduct/${template}.tsx`, import.meta.url);
        const source = ts.createSourceFile(template, readFileSync(path, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
        const text = source.getFullText();
        assert.match(text, /<ApiloSubmitControls\s+addToApilo=\{addToApilo\}/, template);
        assert.match(text, /\[addToApilo, setAddToApilo\] = useState\(true\)/, template);
        let checkedCalls = 0;

        const visit = (node) => {
            if (ts.isCallExpression(node)) {
                const callee = node.expression.getText(source);
                const firstArgument = node.arguments[0]?.getText(source) ?? '';
                const isApiloCall = callee === 'AddImageApilo' || callee === 'AddProductApilo' ||
                    apiloEndpoint.test(firstArgument);
                if (isApiloCall) {
                    checkedCalls++;
                    let guarded = false;
                    for (let parent = node.parent; parent; parent = parent.parent) {
                        if (ts.isIfStatement(parent) && parent.expression.getText(source) === 'addToApilo' &&
                            node.pos >= parent.thenStatement.pos && node.end <= parent.thenStatement.end) {
                            guarded = true;
                            break;
                        }
                    }
                    assert.ok(guarded, `${template}: unguarded ${callee}(${firstArgument})`);
                }
            }
            ts.forEachChild(node, visit);
        };
        visit(source);
        assert.ok(checkedCalls > 0, `${template}: no Apilo call was checked`);
    }
});
