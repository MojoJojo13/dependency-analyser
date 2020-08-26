"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Contains information about imported modules.
 */
class ImportCount {
    constructor(fileName, importDeclaration, sourceFile, isNodeModule) {
        this._fileName = fileName;
        this._importDeclaration = importDeclaration;
        this._sourceFile = sourceFile;
        this._isNodeModule = isNodeModule;
    }
    get fileName() {
        return this._fileName;
    }
    set fileName(value) {
        this._fileName = value;
    }
    get importDeclaration() {
        return this._importDeclaration;
    }
    set importDeclaration(value) {
        this._importDeclaration = value;
    }
    get sourceFile() {
        return this._sourceFile;
    }
    set sourceFile(value) {
        this._sourceFile = value;
    }
    get isNodeModule() {
        return this._isNodeModule;
    }
    set isNodeModule(value) {
        this._isNodeModule = value;
    }
    /**
     * Returns module name.
     */
    get dependencyName() {
        return this._importDeclaration.getModuleSpecifier();
    }
}
exports.ImportCount = ImportCount;
//# sourceMappingURL=importCount.js.map