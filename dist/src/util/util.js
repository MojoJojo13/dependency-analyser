"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.printChildren = void 0;
const ts = require("typescript");
/**
 * Prints recursively all children nodes of given node as tree.
 */
function printChildren(node, indent) {
    indent = indent || "";
    node.forEachChild(child => {
        /* tslint:disable:no-console */
        if (child.escapedText) {
            console.log(indent + "SyntaxKind:", child.kind + " " + ts.SyntaxKind[child.kind], "| EscapedText:", child.escapedText);
        }
        else if (child.text) {
            console.log(indent + "SyntaxKind:", child.kind + " " + ts.SyntaxKind[child.kind], "| Text:", child.text);
        }
        else {
            console.log(indent + "SyntaxKind:", child.kind + " " + ts.SyntaxKind[child.kind]);
        }
        /* tslint:disable:no-console */
        printChildren(child, indent + "  ");
    });
}
exports.printChildren = printChildren;
//# sourceMappingURL=util.js.map