import * as ts from "typescript";
import {ClassDeclaration} from "typescript";

// import {ExportDeclaration, ExportSpecifier, NamedExports, NamespaceExport, SourceFile} from "typescript";

export class ExportScanner {
    exportNodesMap;

    constructor() {
    }

    scanFile = function (source: ts.SourceFile) {
        let exportNodesMap = new Map();

        source.forEachChild(child => {

            switch (child.kind) {
                case ts.SyntaxKind.FunctionDeclaration:
                case ts.SyntaxKind.ClassDeclaration:
                case ts.SyntaxKind.InterfaceDeclaration:
                case ts.SyntaxKind.TypeAliasDeclaration:
                case ts.SyntaxKind.EnumDeclaration:
                case ts.SyntaxKind.ModuleDeclaration:
                    const declaration = <ts.FunctionDeclaration | ts.ClassDeclaration | ts.InterfaceDeclaration | ts.TypeAliasDeclaration | ts.EnumDeclaration>child;
                    let name = declaration.name.escapedText.toString();

                    if (name) {
                        exportNodesMap.set(name, new Declaration(child));
                    } else {
                        console.log("Error: can't find name");
                    }
                    break;

                case ts.SyntaxKind.FirstStatement:
                    //child = <ts.VariableStatement>child; //FixMe
                    if (child.declarationList) {
                        let declaration = new Declaration(child);

                        child.declarationList.declarations.forEach(value => {
                            let name = value.name.escapedText.toString();
                            exportNodesMap.set(name, declaration);
                        })
                    }
                    break;

                case ts.SyntaxKind.ExportAssignment:
                    console.log("TODO:", child.kind + " " + ts.SyntaxKind[child.kind]);
                    console.log(child);
                    // TODO: implement
                    break;

                case ts.SyntaxKind.ExportDeclaration:
                    // check for alias
                    const exportDeclaration = <ts.ExportDeclaration>child;

                    if (exportDeclaration.exportClause.kind === 261 /* NamedExports */) {
                        let namedExports = <ts.NamedExports>exportDeclaration.exportClause;

                        namedExports.elements.forEach(function (value: ts.ExportSpecifier) {
                            let myExportDeclaration = new MyExportDeclaration();

                            // set alias if found
                            if (value.propertyName && value.name) {
                                let name = value.propertyName.escapedText.toString();
                                let alias = value.name.escapedText.toString();
                                let exportNode = exportNodesMap.get(name);

                                if (exportNode) {
                                    exportNode.alias = alias;
                                }
                            }
                        });
                    } else {
                        console.log("Can't handle this 9541");
                    }

                    break;
                case ts.SyntaxKind.EndOfFileToken: // ignore
                    break;
                default:
                    console.log("Error: Can't handle it right now | Kind:", child.kind + " " + ts.SyntaxKind[child.kind]);
                // console.log("child", child);
            }
        });

        // console.log("exportNodesMap", exportNodesMap);
        exportNodesMap.forEach(function (value: Declaration, index: string) {
            console.log("~~~~~~~~~~~~~~~~~~~");
            console.log(`exportNodesMap[${index}] =`, value.toString());
        })
    }
}

function _getMemberMap(node: ts.InterfaceDeclaration | ts.ClassDeclaration) {
    let membersMap = new Map<string, Declaration>();

    if (!node.members) {
        console.error("No members found!");
        return;
    }

    node.members.forEach(value => {
        // console.log("value", value);
        switch (value.kind) {
            case ts.SyntaxKind.MethodSignature:
                membersMap.set(value.name.escapedText, new MethodSignature(value));
                break;
            case ts.SyntaxKind.MethodDeclaration:
                membersMap.set(value.name.escapedText, new MethodDeclaration(value));
                break;
            case ts.SyntaxKind.PropertyDeclaration:
                membersMap.set(value.name.escapedText, new PropertyDeclaration(value));
                break;
            default:
                console.log("Wtf is this?");

        }
    });

    return membersMap;
}

function findExportDeclarationNodeRek(node: ts.Node, identifierName: MyExportDeclaration) {
    // let declarationNode: ts.Node;

    node.forEachChild(child => {

        if (child.kind === ts.SyntaxKind.Identifier) {
            const identifier = <ts.Identifier>child;

            if (identifier.escapedText === identifierName.identifier) {
                switch (node.kind) {
                    case ts.SyntaxKind.ClassDeclaration:
                    case ts.SyntaxKind.InterfaceDeclaration:
                    case ts.SyntaxKind.FunctionDeclaration:
                        identifierName.declarationNode = node;
                        identifierName.kind = node.kind;
                        break;
                    case ts.SyntaxKind.VariableDeclaration:

                        break;
                }
            }
        } else {
            findExportDeclarationNodeRek(child, identifierName);
        }
    });

    // return declarationNode;
}

function findExportDeclarations(source: ts.SourceFile) {
    let exports: MyExportDeclaration[] = [];
    source.forEachChild(child => {

        if (child.kind === 260 /* ExportDeclaration */) {
            const exportDeclaration = <ts.ExportDeclaration>child;

            if (exportDeclaration.exportClause.kind === 261 /* NamedExports */) {
                let namedExports = <ts.NamedExports>exportDeclaration.exportClause;

                namedExports.elements.forEach(function (value: ts.ExportSpecifier) {
                    let myExportDeclaration = new MyExportDeclaration();

                    // find and set identifier and alias
                    if (value.propertyName && value.name) {
                        myExportDeclaration.identifier = value.propertyName.escapedText.toString();
                        myExportDeclaration.alias = value.name.escapedText.toString();
                    } else if (value.propertyName) {
                        myExportDeclaration.identifier = value.propertyName.escapedText.toString();
                    } else if (value.name) {
                        myExportDeclaration.identifier = value.name.escapedText.toString();
                    }

                    // find and set the declaration node
                    findExportDeclarationNodeRek(source, myExportDeclaration);

                    exports.push(myExportDeclaration);
                });

            } else if (exportDeclaration.exportClause.kind === 262 /* NamespaceExport */) {
                let namespaceExport = <ts.NamespaceExport>exportDeclaration.exportClause;

                console.log("namespaceExport", namespaceExport);
            } else {
                console.log("Can't handle this 0");
            }
        }

    });

    console.log("exports", exports);
    return exports;
}

export {findExportDeclarations};

class Declaration {
    private _node: ts.Node;
    private _alias: string;

    constructor(node: ts.Node) {
        this.node = node;
    }

    toString(): string {
        let returnString = `Kind: ${ts.SyntaxKind[this.getKind()]}`;

        if (this.alias) {
            returnString += ` | Alias: ${this.alias}`;
        }
        // if (this.getKind() === ts.SyntaxKind.InterfaceDeclaration || this.getKind() === ts.SyntaxKind.ClassDeclaration) {
        //     console.log("this.getMembers()", this.getMembers());
        // }
        //
        // if (this.getKind() === ts.SyntaxKind.TypeLiteral) {
        //     console.log("this.node", this.node.declarationList.declarations[0]);
        //     //TODO: continue here
        // }

        return returnString;
    }
    
    getMembers() {
        return _getMemberMap(<ts.InterfaceDeclaration | ts.ClassDeclaration> this.node);
    }

    getKind(): ts.SyntaxKind {
        if (this.node.kind === ts.SyntaxKind.FirstStatement) {
            let declarations = this.node.declarationList.declarations;
            return declarations[declarations.length - 1].type.kind;
        }
        return this.node.kind;
    }

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
}

class MethodDeclaration extends Declaration {

}

class PropertyDeclaration extends Declaration {

}

class MethodSignature extends Declaration {

}

class MyExportDeclaration {
    private _identifier: string;
    private _alias: string;
    private _kind: ts.SyntaxKind;
    private _declarationNode: ts.Node;

    constructor() {

    }

    // Getter & Setter

    get alias(): string {
        return this._alias;
    }

    set alias(value: string) {
        this._alias = value;
    }

    get identifier(): string {
        return this._identifier;
    }

    set identifier(value: string) {
        this._identifier = value;
    }

    get kind(): ts.SyntaxKind {
        return this._kind;
    }

    set kind(value: ts.SyntaxKind) {
        this._kind = value;
    }

    get declarationNode(): ts.Node {
        return this._declarationNode;
    }

    set declarationNode(value: ts.Node) {
        this._declarationNode = value;
    }
}