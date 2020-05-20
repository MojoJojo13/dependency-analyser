import * as ts from "typescript";
import {Declaration, ImportDeclaration, PropertyDeclaration} from "./Declarations";
import {DependencyAnalyser} from "./DependencyAnalyser";
import * as path from "path";
import {ExportScanner} from "./exportService";
import assert = require("assert");

export class ImportScanner {

    private _dependencyAnalyser: DependencyAnalyser;
    private _fileName: string;
    private _source: ts.SourceFile;
    private _importMap = new Map<string, Declaration>();
    private _variableMap = new Map<string, Declaration>();
    private _counts = new Map<string, number>();

    constructor(dependencyAnalyser: DependencyAnalyser, fileName: string, source: ts.SourceFile) {
        this.dependencyAnalyser = dependencyAnalyser;
        this.fileName = fileName;
        this.source = source;
        printChildren(source);
        console.log("-------------------");
        this.scanSource(source);
        console.log("-------------------");
        //this.surfaceCount(source);
        // console.log("globalCount:", this.globalCount);
        // console.log("this.importMap", this.importMap);
        // console.log("counts", this._counts);
    }

    surfaceCountWrapper() {
        this.surfaceCountRek(this.source);
        console.log("counts", this._counts);
    }

    surfaceCountRek(node: ts.Node) {

        node.forEachChild(child => {
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
                    this.surfaceCountRek(child);

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

                    // find and set the exportScanner
                    let importSpecifier = importDeclaration.getModuleSpecifier();
                    let exportScanner: ExportScanner;

                    // is it a local module which starts with '../ or './'
                    if (RegExp('^(\\.\\.\\/)|^(\\.\\/)').test(importSpecifier)) {
                        const dtsFileName = path.join(path.dirname(this.fileName), importSpecifier) + ".d.ts";
                        exportScanner = this.dependencyAnalyser.dtsCreator.exportScannerMap.get(dtsFileName);
                        console.assert(exportScanner, "Export Scanner not found or not existing");
                        importDeclaration.exportScanner = exportScanner;
                    } else {
                        //TODO: finish for dependencies
                    }

                    // let pathToModule = require.resolve(importDeclaration.getModuleSpecifier());
                    // console.log("pathToModule", pathToModule);

                    if (importSpecifiers.length === 0 && importDeclaration.getModuleSpecifier() !== "") {
                        console.log("importDeclaration.getModuleSpecifier()", importDeclaration.getModuleSpecifier());
                        //TODO: do something with: import "./simpleExports"
                    }

                    // TODO: follow only dependencies
                    importSpecifiers.forEach(function (value: string) {
                        this.importMap.set(value, importDeclaration);
                    }.bind(this));

                    break;

                // case ts.SyntaxKind.VariableDeclarationList:
                //
                //     break;

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
                                // set reference to find the type easier
                                declaration.reference = typeName;
                                declaration.getA().forEach(value => {
                                    console.log("importMap.set", value);
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
                case ts.SyntaxKind.CallExpression:
                    let callExpression = <ts.CallExpression>child;
                    if (ts.isPropertyAccessExpression(callExpression.expression)) {
                        let propertyAccessExpression = <ts.PropertyAccessExpression>callExpression.expression;

                        let type = findMeTheTypeRek(propertyAccessExpression.expression, this.importMap);
                        console.log("FirstType", type);

                        // console.log("type", type);

                    } else {
                        console.log("it's not a PropertyAccessExpression: do something about it");
                    }

                    console.log("CallExpression", child);

                    break;
                case ts.SyntaxKind.PropertyAccessExpression:
                    // ts.isPropertyAccessExpression();
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

    get dependencyAnalyser(): DependencyAnalyser {
        return this._dependencyAnalyser;
    }

    set dependencyAnalyser(value: DependencyAnalyser) {
        this._dependencyAnalyser = value;
    }

    get fileName(): string {
        return this._fileName;
    }

    set fileName(value: string) {
        this._fileName = value;
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

    get variableMap(): Map<string, Declaration> {
        return this._variableMap;
    }

    set variableMap(value: Map<string, Declaration>) {
        this._variableMap = value;
    }

    get counts(): Map<string, number> {
        return this._counts;
    }

    set counts(value: Map<string, number>) {
        this._counts = value;
    }
}

function findMeTheTypeRek(expression: ts.Node, variableMap): string {
    if (ts.isCallExpression(expression)) {
        let callExpression = <ts.CallExpression>expression;

        assert(ts.isPropertyAccessExpression(callExpression.expression), "it's not a PropertyAccessExpression");

        let propertyAccessExpression = <ts.PropertyAccessExpression>callExpression.expression;

        // console.log("propertyAccessExpression", propertyAccessExpression);
        let propertyName = propertyAccessExpression.name.escapedText.toString();

        let typeName = findMeTheTypeRek(propertyAccessExpression.expression, variableMap);
        if (typeName) {

            let type = variableMap.get(typeName);
            let exportScanner = type.exportScanner;
            let propertyDeclaration = <PropertyDeclaration>exportScanner.exportNodesMap.get(typeName).getMembers().get(propertyName);
            // if (propertyDeclaration) //TODO: count this as a successful call
            // @ts-ignore
            let retType = propertyDeclaration.node.type.type.typeName.escapedText;
            console.log("retType", retType);
            if (retType) { //TODO: implement not void and any types
                return retType;
            }
            // console.log("typeName", typeName);
            // console.log("type", type);
            // console.log("exportScanner", exportScanner);
            // console.log("exportNodesMap", exportScanner.exportNodesMap);
            // console.log("exportNodesMap.get(typeName)", exportScanner.exportNodesMap.get(typeName));
            // console.log(".getMembers()", exportScanner.exportNodesMap.get(typeName).getMembers());
            // console.log("propertyDeclaration", propertyDeclaration);

        }

        //TODO: type.getProperties().has(expression.name)
        // if yes, then get type of that property and return it, else, cant handle this

        // console.log("type", type);

    } else if (ts.isIdentifier(expression)) {
        let identifier = <ts.Identifier>expression;
        let name = identifier.escapedText.toString();
        let variable = variableMap.get(name);
        console.log("variable", variable);

        return variable.reference || name;

        // let referenceName = variable.reference;
        // console.log("referenceName", referenceName);
        // if (referenceName) {
        //     let refVariable = variableMap.get(referenceName);
        //     console.log("refVariable", refVariable);
        //
        //     // let typeName = refVariable.getType();//.typeName.escapedText;
        //     // console.log("refVariable => typeName", typeName);
        // } else {
        //     // let typeName = variable.getType();//.typeName.escapedText;
        //     // console.log("variable => typeName", typeName);
        // }
        // TODO: return type;
    } else {
        console.log("it's not a CallExpression or an Identifier: do something about it");
    }
}

export function printChildren(node, indent?: string) {
    indent = indent || "";

    node.forEachChild(child => {

        if (child.escapedText) {
            console.log(indent + "SyntaxKind:", child.kind + " " + ts.SyntaxKind[child.kind], "| EscapedText:", child.escapedText);
        } else if (child.text) {
            console.log(indent + "SyntaxKind:", child.kind + " " + ts.SyntaxKind[child.kind], "| Text:", child.text);
        } else {
            console.log(indent + "SyntaxKind:", child.kind + " " + ts.SyntaxKind[child.kind]);
        }

        printChildren(child, indent + "  ");
    })
}