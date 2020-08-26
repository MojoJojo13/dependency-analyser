import * as ts from "typescript";
import {Declaration} from "./declaration";

/**
 * Class to store information about module imports.
 */
export class ImportDeclaration extends Declaration {

    get node(): ts.ImportDeclaration {
        return this._node as ts.ImportDeclaration;
    }

    set node(value: ts.ImportDeclaration) {
        this._node = value;
    }

    get fileName(): string {
        return this._fileName;
    }

    set fileName(value: string) {
        this._fileName = value;
    }

    private _fileName: string;

    isEntireModuleImported(): boolean {
        return this.node.importClause
            && this.node.importClause.namedBindings
            && ts.isNamespaceImport(this.node.importClause.namedBindings);
    }

    getImportSpecifiers(): string[] {
        const importSpecifiers: string[] = [];
        const importClause = this.node.importClause as ts.ImportClause;

        if (!importClause) return [];

        if (importClause.name) {
            importSpecifiers.push(importClause.name.escapedText.toString());
        }

        if (importClause.namedBindings) {
            // type NamedImportBindings = NamespaceImport | NamedImports;
            const namedBindings = importClause.namedBindings as ts.NamedImportBindings;

            if (ts.isNamespaceImport(namedBindings)) {
                importSpecifiers.push(namedBindings.name.escapedText.toString());
            } else if (ts.isNamedImports(namedBindings)) {
                (namedBindings as ts.NamedImports).elements.forEach(value => importSpecifiers.push(value.name.escapedText.toString()));
            }
        }

        return importSpecifiers;
    }

    getModuleSpecifier(): string {
        return this.node.moduleSpecifier["text"] as string;
    }

}