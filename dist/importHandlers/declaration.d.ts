import * as ts from "typescript";
export declare class Declaration {
    get node(): ts.Node;
    set node(value: ts.Node);
    get alias(): string;
    set alias(value: string);
    get reference(): string;
    set reference(value: string);
    protected _node: ts.Node;
    private _alias;
    private _reference;
    constructor(node: ts.Node);
    getType(): any;
    getKind(): ts.SyntaxKind;
}
