import * as ts from "typescript";

export class Declaration {
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

    protected _node: ts.Node;
    private _alias: string;
    private _reference: string;

    constructor(node: ts.Node) {
        this.node = node;
    }

    getType() {
        if (this.node.kind === ts.SyntaxKind.FirstStatement) {
            // @ts-ignore
            const declarations = this.node.declarationList.declarations;
            return declarations[declarations.length - 1].type;
        }

        return;
    }

    getKind(): ts.SyntaxKind {
        if (this.node.kind === ts.SyntaxKind.FirstStatement) {
            return this.getType() ? this.getType().kind : undefined;
        }

        return this.node.kind;
    }
}