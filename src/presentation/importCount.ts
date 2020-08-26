import * as ts from "typescript";
import {ImportDeclaration} from "../importHandlers/importDeclaration";

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

    get importDeclaration(): ImportDeclaration {
        return this._importDeclaration;
    }

    set importDeclaration(value: ImportDeclaration) {
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
    private _importDeclaration: ImportDeclaration;
    private _sourceFile: ts.SourceFile;
    private _isNodeModule: boolean;

    constructor(
        fileName: string,
        importDeclaration: ImportDeclaration,
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