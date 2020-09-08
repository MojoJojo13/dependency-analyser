import * as ts from "typescript";
import { Declaration } from "../importHandlers/declaration";
/**
 * Contains information about usages of imported modules.
 */
export declare class UsageCount {
    get fileName(): string;
    set fileName(value: string);
    get importDeclaration(): Declaration;
    set importDeclaration(value: Declaration);
    get identifier(): ts.Identifier;
    set identifier(value: ts.Identifier);
    private _fileName;
    private _importDeclaration;
    private _identifier;
    constructor(fileName: string, importDeclaration: Declaration, identifier: ts.Identifier);
    /**
     * Returns module name.
     */
    get dependencyName(): string;
}
