"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Contains information about usages of imported modules.
 */
class UsageCount {
    constructor(fileName, importDeclaration, identifier) {
        this._fileName = fileName;
        this._importDeclaration = importDeclaration;
        this._identifier = identifier;
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
    get identifier() {
        return this._identifier;
    }
    set identifier(value) {
        this._identifier = value;
    }
    /**
     * Returns module name.
     */
    get dependencyName() {
        return this._importDeclaration.getModuleSpecifier();
    }
}
exports.UsageCount = UsageCount;
//# sourceMappingURL=usageCount.js.map