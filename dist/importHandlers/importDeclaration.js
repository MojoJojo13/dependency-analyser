"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ts = require("typescript");
const declaration_1 = require("./declaration");
/**
 * Class to store information about module imports.
 */
class ImportDeclaration extends declaration_1.Declaration {
    get node() {
        return this._node;
    }
    set node(value) {
        this._node = value;
    }
    get fileName() {
        return this._fileName;
    }
    set fileName(value) {
        this._fileName = value;
    }
    isEntireModuleImported() {
        return this.node.importClause
            && this.node.importClause.namedBindings
            && ts.isNamespaceImport(this.node.importClause.namedBindings);
    }
    getImportSpecifiers() {
        const importSpecifiers = [];
        const importClause = this.node.importClause;
        if (!importClause)
            return [];
        if (importClause.name) {
            importSpecifiers.push(importClause.name.escapedText.toString());
        }
        if (importClause.namedBindings) {
            // type NamedImportBindings = NamespaceImport | NamedImports;
            const namedBindings = importClause.namedBindings;
            if (ts.isNamespaceImport(namedBindings)) {
                importSpecifiers.push(namedBindings.name.escapedText.toString());
            }
            else if (ts.isNamedImports(namedBindings)) {
                namedBindings.elements.forEach(value => importSpecifiers.push(value.name.escapedText.toString()));
            }
        }
        return importSpecifiers;
    }
    getModuleSpecifier() {
        return this.node.moduleSpecifier["text"];
    }
}
exports.ImportDeclaration = ImportDeclaration;
//# sourceMappingURL=importDeclaration.js.map