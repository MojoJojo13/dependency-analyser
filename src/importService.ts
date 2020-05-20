import * as ts from "typescript";
import {Declaration, ImportDeclaration} from "./Declarations";

export class ImportScanner {

    private _source: ts.SourceFile;
    private _importMap = new Map<string, Declaration>();
    private _counts = new Map<string, number>();
    globalCount: number = 0;

    constructor(source) {
        this.source = source;
        this.scanSource(source);
        console.log("-------------------");
        //this.surfaceCount(source);
        // console.log("globalCount:", this.globalCount);
        // console.log("this.importMap", this.importMap);
        // console.log("counts", this._counts);
    }

    surfaceCountWrapper() {
        this.surfaceCount(this.source);
        console.log("counts", this._counts);
    }

    surfaceCount(node?: ts.Node) {
        let source = node || this.source; //TODO: can be removed

        source.forEachChild(child => {
            switch (child.kind) {
                case ts.SyntaxKind.ImportDeclaration:
                    let importDeclaration = new ImportDeclaration(child);
                    let importSpecifiers = importDeclaration.getImportSpecifiers();

                    importSpecifiers.forEach(function (value: string) {
                        this.importMap.set(value, importDeclaration);
                    }.bind(this));

                    break;

                case ts.SyntaxKind.Identifier:
                    let text: string = <string>(<ts.Identifier>child).escapedText;
                    let imprt = this.importMap.get(text);

                    if (imprt) {
                        let n = this._counts.get(text);
                        this._counts.set(text, n + 1 || 1);
                    }

                    break;

                default:
                    this.surfaceCount(child);

                    break;
            }
        });
    }

    scanSource(node: ts.Node) {
        let that = this;

        node.forEachChild(child => {
            switch (child.kind) {
                case ts.SyntaxKind.ImportDeclaration:
                    //console.log("child", child);
                    let importDeclaration = new ImportDeclaration(child);
                    let importSpecifiers = importDeclaration.getImportSpecifiers();

                    // let pathToModule = require.resolve(importDeclaration.getModuleSpecifier());
                    // console.log("pathToModule", pathToModule);

                    if (importSpecifiers.length === 0 && importDeclaration.getModuleSpecifier() !== "") {
                        console.log("importDeclaration.getModuleSpecifier()", importDeclaration.getModuleSpecifier());
                        //TODO: 
                    }

                    // TODO: follow only dependencies
                    importSpecifiers.forEach(function (value: string) {
                        this.importMap.set(value, importDeclaration);
                    }.bind(this));

                    break;

                case ts.SyntaxKind.FirstStatement:
                    // console.log("child", child);

                    if ((<any>child).declarationList) {
// console.log("child.declarationList.declarations", child.declarationList.declarations);
// console.log("child.declarationList.declarations.initializer", child.declarationList.declarations[0].initializer);
                        let declaration = new Declaration(child);
                        // console.log("declaration.getKind()", declaration.getKind());
                        if (declaration.getKind() === ts.SyntaxKind.TypeReference) {
                            // console.log("declaration.getType()", declaration.getType());
                            let typeName = declaration.getType().typeName.escapedText;
                            let importedType = this.importMap.get(typeName);

                            if (importedType) {
                                declaration.getA().forEach(value => {
                                    // console.log("importMap.set", value);
                                    this.importMap.set(value, declaration);
                                })
                            }
                        }
                    } else {
                        console.log("no idea what kind of statement that is:", ts.SyntaxKind[child.kind]);
                    }

                    break;

                // case ts.SyntaxKind.ExpressionStatement:
                //     if (child.expression.kind === ts.SyntaxKind.CallExpression) {
                //         console.log("child.expression", child.expression);
                //     } else {
                //         console.log("no idea what kind of expression that is:", ts.SyntaxKind[child.kind]);
                //     }
                //     break;
                case ts.SyntaxKind.PropertyAccessExpression:
                    let propertyAccess = <ts.PropertyAccessExpression>child;

                    if (propertyAccess.expression) {

                        if (propertyAccess.expression.kind === ts.SyntaxKind.Identifier) {
                            let text = (<ts.Identifier>propertyAccess.expression).escapedText.toString();
                            console.log("text", text);
                            let importDeclaration = this.importMap.get(text);
                            console.log("importDeclaration", importDeclaration);
                            if (importDeclaration) {
                                // TODO: make better or introduce reference to separate between imports and variables
                                if (importDeclaration.getType()) {
                                    let typeName = importDeclaration.getType().typeName.escapedText;

                                    if (typeName) {
                                        let typeDeclaration = this.importMap.get(typeName);
                                        if (typeDeclaration) {
                                            typeDeclaration.getMembers();
                                            //TODO: continue here
                                        }
                                    }
                                }

                                // let property = propertyAccess.name.escapedText;
                                // console.log("property", typeName);
                                // importDeclaration.getProperties();

                            }
                        } else { //TODO: maybe check for Expression

                        }
                    }
                    console.log("ts.SyntaxKind.PropertyAccessExpression", child);
                    break;

                case ts.SyntaxKind.ImportEqualsDeclaration: // Not supported
                    console.log("Not supported", child.kind);
                    break;

                case ts.SyntaxKind.EndOfFileToken: // Ignore
                    break;

                default:
                    console.log("Can't handle this:", child.kind);
                    that.scanSource(child);
                    break;
            }
        })

        //console.log("this.importMap", this.importMap);
    }

    get source(): ts.SourceFile {
        return this._source;
    }

    set source(value: ts.SourceFile) {
        this._source = value;
    }

    get importMap() {
        return this._importMap;
    }

    set importMap(value) {
        this._importMap = value;
    }

    get counts(): Map<string, number> {
        return this._counts;
    }

    set counts(value: Map<string, number>) {
        this._counts = value;
    }
}

// class Declaration {
//     protected _node: ts.Node;
//
//     constructor(node) {
//         this.node = node;
//     }
//
//     get node(): ts.Node {
//         return this._node;
//     }
//
//     set node(value: ts.Node) {
//         this._node = value;
//     }
// }
//
// class ImportDeclaration extends Declaration {
//
//     getImportSpecifiers(): string[] {
//         return <string[]>this.node.importClause.namedBindings.elements.map(value => value.name.escapedText);
//     }
//
//     getModuleSpecifier(): string {
//         return <string>this.node.moduleSpecifier.text;
//     }
//
//     get node(): ts.ImportDeclaration {
//         return <ts.ImportDeclaration>this._node;
//     }
//
//     set node(value: ts.ImportDeclaration) {
//         this._node = value;
//     }
// }