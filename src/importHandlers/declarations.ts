import * as ts from "typescript";
import {SourceFile} from "../exportHandlers/exportDeclarations";

export class Declaration {
    get node(): ts.Node {
        return this._node;
    }

    set node(value: ts.Node) {
        this._node = value;
    }

    get alias(): string {
        return this._alias;
    }

    set alias(value: string) {
        this._alias = value;
    }

    get reference(): string {
        return this._reference;
    }

    set reference(value: string) {
        this._reference = value;
    }

    protected _node: ts.Node;
    private _alias: string;
    private _reference: string;

    constructor(node: ts.Node) {
        this.node = node;
    }

    getType() {
        if (this.node.kind === ts.SyntaxKind.FirstStatement) {
            // @ts-ignore
            const declarations = this.node.declarationList.declarations;
            return declarations[declarations.length - 1].type;
        }

        return;
    }

    getKind(): ts.SyntaxKind {
        if (this.node.kind === ts.SyntaxKind.FirstStatement) {
            return this.getType() ? this.getType().kind : undefined;
        }

        return this.node.kind;
    }
}

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

    get sourceFile(): SourceFile {
        return this._sourceFile;
    }

    set sourceFile(value: SourceFile) {
        this._sourceFile = value;
    }

    private _fileName: string;
    private _sourceFile: SourceFile;

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

/**
 * Class to store information about require module imports.
 * @deprecated
 */
export class RequireDeclaration extends Declaration {

    get node(): ts.VariableDeclaration {
        return this._node as ts.VariableDeclaration;
    }

    set node(value: ts.VariableDeclaration) {
        this._node = value;
    }

    isEntireModuleImported(): boolean {
        return true;
    }

    getImportSpecifiers(): string[] {
        if (ts.isIdentifier(this.node.name)) {
            return [this.node.name.escapedText.toString()];
        }

        return [];
    }

    getModuleSpecifier(): string {
        let initializer = this.node.initializer;

        if (initializer && ts.isAsExpression(initializer)) {
            initializer = initializer.expression;
        }

        if (ts.isCallExpression(initializer)) {
            const identifier = initializer.expression;

            if (ts.isIdentifier(identifier)) {
                if (identifier.originalKeywordKind === ts.SyntaxKind.RequireKeyword) {
                    const moduleIdentifier = initializer.arguments[0];
                    if (ts.isStringLiteral(moduleIdentifier)) {
                        return moduleIdentifier.text.toString();
                    }
                }
            }
        }

        return "";
    }
}