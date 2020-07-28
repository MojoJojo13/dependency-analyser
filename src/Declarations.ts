import * as ts from "typescript";
import * as fs from "fs";
import * as path from "path";
import {NamedImports, NamespaceImport} from "typescript";
import {ExportScanner} from "./exportService";
import {SourceFile} from "./exportDeclarations";

export class Declaration {

    protected _node: ts.Node;
    private _alias: string;
    private _reference: string;

    constructor(node: ts.Node) {
        this.node = node;
    }

    getProperties() {
        // @ts-ignore
        console.log("this.node", this.node.declarationList);
    }

    toString(): string {
        let returnString = `Kind: ${ts.SyntaxKind[this.getKind()]}`;

        if (this.alias) {
            returnString += ` | Alias: ${this.alias}`;
        }
        // if (this.getKind() === ts.SyntaxKind.InterfaceDeclaration || this.getKind() === ts.SyntaxKind.ClassDeclaration) {
        //     console.log("this.getMembers()", this.getMembers());
        // }

        // if (this.getKind() === ts.SyntaxKind.TypeLiteral) {
        //     console.log("this.node", this.node.declarationList.declarations[0]);
        //     //TODO: continue here
        // }

        return returnString;
    }

    getMembers() {
        //return _getMemberMap(<ts.InterfaceDeclaration | ts.ClassDeclaration> this.node);
    }

    getType() {
        if (this.node.kind === ts.SyntaxKind.FirstStatement) {
            // @ts-ignore
            let declarations = this.node.declarationList.declarations;
            return declarations[declarations.length - 1].type;
        }

        return;
    }

    getA(): string[] {
        // @ts-ignore
        return this.node.declarationList.declarations.map(value => <string>value.name.escapedText);
    }

    getKind(): ts.SyntaxKind {
        if (this.node.kind === ts.SyntaxKind.FirstStatement) {
            return this.getType() ? this.getType().kind : undefined;
        }
        return this.node.kind;
    }

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
}

export class ImportDeclaration extends Declaration {
    private _fileName: string;
    /**
     * @deprecated
     */
    private _exportScanner: ExportScanner;
    private _sourceFile: SourceFile;
    private _isDependency: boolean;

    isEntireModuleImported(): boolean {
        return this.node.importClause
            && this.node.importClause.namedBindings
            && ts.isNamespaceImport(this.node.importClause.namedBindings);
    }

    getImportSpecifiers(): string[] {
        let importSpecifiers: string[] = [];
        let importClause = <ts.ImportClause>this.node.importClause;

        if (!importClause) return [];

        if (importClause.name) {
            importSpecifiers.push(importClause.name.escapedText.toString());
        }

        if (importClause.namedBindings) {
            // type NamedImportBindings = NamespaceImport | NamedImports;
            let namedBindings = <ts.NamedImportBindings>importClause.namedBindings;

            if (ts.isNamespaceImport(namedBindings)) {
                importSpecifiers.push(namedBindings.name.escapedText.toString());
            } else if (ts.isNamedImports(namedBindings)) {
                (<ts.NamedImports>namedBindings).elements.forEach(value => importSpecifiers.push(value.name.escapedText.toString()));
            }
        }

        return importSpecifiers;
    }

    getModuleSpecifier(): string {
        return <string>this.node.moduleSpecifier["text"];
    }

    get node(): ts.ImportDeclaration {
        return <ts.ImportDeclaration>this._node;
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
    /**
     * @deprecated
     */
    get exportScanner(): ExportScanner {
        return this._exportScanner;
    }
    /**
     * @deprecated
     */
    set exportScanner(value: ExportScanner) {
        this._exportScanner = value;
    }

    get sourceFile(): SourceFile {
        return this._sourceFile;
    }

    set sourceFile(value: SourceFile) {
        this._sourceFile = value;
    }

    get isDependency(): boolean {
        return this._isDependency;
    }

    set isDependency(value: boolean) {
        this._isDependency = value;
    }
}

//--- Export Service ---

// export class MethodDeclaration extends Declaration {}
//
// export class PropertyDeclaration extends Declaration {}
//
// export class MethodSignature extends Declaration {}