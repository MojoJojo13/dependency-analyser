import * as ts from "typescript";

/**
 * Prints recursively all children nodes of given node as tree.
 */
export function printChildren(node, indent?: string) {
    indent = indent || "";

    node.forEachChild(child => {

        if (child.escapedText) {
            console.log(indent + "SyntaxKind:", child.kind + " " + ts.SyntaxKind[child.kind], "| EscapedText:", child.escapedText);
        } else if (child.text) {
            console.log(indent + "SyntaxKind:", child.kind + " " + ts.SyntaxKind[child.kind], "| Text:", child.text);
        } else {
            console.log(indent + "SyntaxKind:", child.kind + " " + ts.SyntaxKind[child.kind]);
        }

        printChildren(child, indent + "  ");
    })
}