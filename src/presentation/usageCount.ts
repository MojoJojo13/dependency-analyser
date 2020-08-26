import * as ts from "typescript";
import {ImportDeclaration} from "../importHandlers/importDeclaration";
import {Declaration} from "../importHandlers/declaration";

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
        return (this._importDeclaration as ImportDeclaration).getModuleSpecifier();
    }
}