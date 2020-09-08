"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Declaration = void 0;
const ts = require("typescript");
class Declaration {
    constructor(node) {
        this.node = node;
    }
    get node() {
        return this._node;
    }
    set node(value) {
        this._node = value;
    }
    get alias() {
        return this._alias;
    }
    set alias(value) {
        this._alias = value;
    }
    get reference() {
        return this._reference;
    }
    set reference(value) {
        this._reference = value;
    }
    getType() {
        if (this.node.kind === ts.SyntaxKind.FirstStatement) {
            // @ts-ignore
            const declarations = this.node.declarationList.declarations;
            return declarations[declarations.length - 1].type;
        }
        return;
    }
    getKind() {
        if (this.node.kind === ts.SyntaxKind.FirstStatement) {
            return this.getType() ? this.getType().kind : undefined;
        }
        return this.node.kind;
    }
}
exports.Declaration = Declaration;
//# sourceMappingURL=declaration.js.map