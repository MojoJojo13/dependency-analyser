import * as ts from "typescript";
import {Declaration, ImportDeclaration, RequireDeclaration} from "../importHandlers/declarations";

/**
 * Contains information about imported modules.
 */
export class ImportCount {
    get fileName(): string {
        return this._fileName;
    }

    set fileName(value: string) {
        this._fileName = value;
    }

    get importDeclaration(): ImportDeclaration | RequireDeclaration {
        return this._importDeclaration;
    }

    set importDeclaration(value: ImportDeclaration | RequireDeclaration) {
        this._importDeclaration = value;
    }

    get sourceFile(): ts.SourceFile {
        return this._sourceFile;
    }

    set sourceFile(value: ts.SourceFile) {
        this._sourceFile = value;
    }

    get isNodeModule(): boolean {
        return this._isNodeModule;
    }

    set isNodeModule(value: boolean) {
        this._isNodeModule = value;
    }

    private _fileName: string;
    private _importDeclaration: ImportDeclaration | RequireDeclaration;
    private _sourceFile: ts.SourceFile;
    private _isNodeModule: boolean;

    constructor(
        fileName: string,
        importDeclaration: ImportDeclaration | RequireDeclaration,
        sourceFile: ts.SourceFile,
        isNodeModule: boolean
    ) {
        this._fileName = fileName;
        this._importDeclaration = importDeclaration;
        this._sourceFile = sourceFile;
        this._isNodeModule = isNodeModule;
    }

    /**
     * Returns module name.
     */
    get dependencyName() {
        return this._importDeclaration.getModuleSpecifier();
    }
}

/**
 * Contains information about usages of imported modules.
 */
export class UsageCount {
    get fileName(): string {
        return this._fileName;
    }

    set fileName(value: string) {
        this._fileName = value;
    }

    get importDeclaration(): Declaration {
        return this._importDeclaration;
    }

    set importDeclaration(value: Declaration) {
        this._importDeclaration = value;
    }

    get identifier(): ts.Identifier {
        return this._identifier;
    }

    set identifier(value: ts.Identifier) {
        this._identifier = value;
    }

    private _fileName: string;
    private _importDeclaration: Declaration;
    private _identifier: ts.Identifier;

    constructor(fileName: string, importDeclaration: Declaration, identifier: ts.Identifier) {
        this._fileName = fileName;
        this._importDeclaration = importDeclaration;
        this._identifier = identifier;
    }

    /**
     * Returns module name.
     */
    get dependencyName(): string {
        return (<ImportDeclaration>this._importDeclaration).getModuleSpecifier();
    }
}