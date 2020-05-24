import * as ts from "typescript";
import {Identifier, ImportSpecifier, NamedImportBindings, NamespaceImport, NodeArray, SyntaxKind} from "typescript";

export class ImportDeclaration {
    node: ts.ImportDeclaration; // | ts.ImportEqualsDeclaration;

    constructor(node: ts.ImportDeclaration) {
        this.node = node;
    }

    printNode() {
        console.log("oNode", this.node);
    }

    getImportClauseName() {
        let ret: string[] = [];
        let importClause: ts.ImportClause = this.node.importClause;
        if (importClause) {
            if (importClause.name) {
                ret.push(importClause.name.escapedText.toString());
            } else if (importClause.namedBindings) {
                let namedBindings: ts.NamedImportBindings = importClause.namedBindings;
                if (importClause.namedBindings.kind === 256 /* NamespaceImport */) {
                    let namespaceImport: ts.NamespaceImport = <ts.NamespaceImport>importClause.namedBindings;
                    ret.push(namespaceImport.name.escapedText.toString());
                } else { // @ts-ignore
                    if (importClause.namedBindings.kind === 257 /* NamedImports */) {
                        let namedImports: ts.NamedImports = <ts.NamedImports>importClause.namedBindings;
                        namedImports.elements.forEach(function (value: ts.ImportSpecifier) {
                            if (value.name) {
                                ret.push(value.name.escapedText.toString());
                            } else if (value.propertyName) {
                                let propertyName: ts.Identifier = value.propertyName;
                                ret.push(propertyName.escapedText.toString());
                            } else {
                                console.log("Can't handle this 3");
                            }
                        });
                    } else {
                        console.log("Can't handle this 2");
                    }
                }
            } else {
                console.log("Can't handle this 1");
            }
        } else {
            ret.push("");
        }

        return ret;
    }

    getModuleName() {
        // @ts-ignore
        return this.node.moduleSpecifier.text;
    }

    setNode(node: ts.ImportDeclaration) {
        this.node = node;
    }

    getNode() {
        return this.node;
    }
}