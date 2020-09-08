import * as ts from "typescript";
import { ImportDeclaration } from "../importHandlers/importDeclaration";
/**
 * Contains information about imported modules.
 */
export declare class ImportCount {
    get fileName(): string;
    set fileName(value: string);
    get importDeclaration(): ImportDeclaration;
    set importDeclaration(value: ImportDeclaration);
    get sourceFile(): ts.SourceFile;
    set sourceFile(value: ts.SourceFile);
    get isNodeModule(): boolean;
    set isNodeModule(value: boolean);
    private _fileName;
    private _importDeclaration;
    private _sourceFile;
    private _isNodeModule;
    constructor(fileName: string, importDeclaration: ImportDeclaration, sourceFile: ts.SourceFile, isNodeModule: boolean);
    /**
     * Returns module name.
     */
    get dependencyName(): string;
}
