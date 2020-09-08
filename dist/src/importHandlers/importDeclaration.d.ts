import * as ts from "typescript";
import { Declaration } from "./declaration";
/**
 * Class to store information about module imports.
 */
export declare class ImportDeclaration extends Declaration {
    get node(): ts.ImportDeclaration;
    set node(value: ts.ImportDeclaration);
    get fileName(): string;
    set fileName(value: string);
    private _fileName;
    isEntireModuleImported(): boolean;
    getImportSpecifiers(): string[];
    getModuleSpecifier(): string;
}
