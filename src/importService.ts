import * as ts from "typescript";
import * as path from "path";
import {Declaration, ImportDeclaration} from "./Declarations";
import {DependencyAnalyser} from "./DependencyAnalyser";
import {ExportScanner, PropertyDeclaration} from "./exportService";
import {printChildren} from "./util";
import {Declaration as ExportDeclaration, ClassDeclaration, EnumDeclaration, InterfaceDeclaration, TypeAliasDeclaration} from "./exportDeclarations";

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

                        let sourceFile = this.dependencyAnalyser.getModuleSourceFile(importSpecifier);

                        // FUN WITH COUNT
                        console.log("sourceFile.getCountMemberMap()", sourceFile.getCountMemberMap());
                        let tsNamespaceArray = sourceFile.getMemberMap().get("ts");
                        tsNamespaceArray.forEach(value => {
                            console.log(Array.from(value.getMemberMap().keys()).length, value.getCountMemberMap());
                        })


                        sourceFile.getMemberMap().get("ts").forEach(value => {
                            // console.log("ts", value.getMemberMap());
                            Array.from(value.getMemberMap().values()).forEach(declarationArray => {
                                declarationArray.forEach(value => {
                                    let name = value.constructor.name;

                                    switch (value.constructor.name) {
                                        case "InterfaceDeclaration":
                                            // console.log(value.getName(), value.getMemberMap());
                                            break;
                                        case "VariableDeclaration": // TODO: Not complete
                                            // console.log(value.getName(), value.getType());
                                            break;
                                        case "TypeAliasDeclaration":
                                            // TODO: do i need them?
                                            break;
                                        case "EnumDeclaration":
                                            // console.log(value.getName(), Array.from((<EnumDeclaration>value).getEnumMembersMap().keys()));
                                            break;
                                        case "FunctionDeclaration":
                                            console.log(value.getName() + " =>", value.getType().getName());
                                            break;
                                    }
                                })
                            })
                        });

                        // console.error("exportScanner.exportNodesMap", sourceFile.getMemberMap());

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

                case ts.SyntaxKind.VariableDeclarationList:
                    handleVariableDeclarationList(<ts.VariableDeclarationList>child, this.importMap);
                    break;

                case ts.SyntaxKind.PropertyAccessExpression:
                    handlePropertyAccessExpression(<ts.PropertyAccessExpression>child, this.importMap);
                    break;

                case ts.SyntaxKind.CallExpression:
                    handleCallExpression(<ts.CallExpression>child, this.importMap);
                    break;

                case ts.SyntaxKind.ImportEqualsDeclaration: // Not supported for now
                    console.error(`Not supported: ${ts.SyntaxKind[child.kind]} (${child.kind})`);
                    break;

                case ts.SyntaxKind.EndOfFileToken: // Ignore
                    break;

                default:
                    console.log(`Can't handle this: ${ts.SyntaxKind[child.kind]} (${child.kind})`);
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

function handleVariableDeclarationList(
    variableDeclarationList: ts.VariableDeclarationList,
    variableMap: Map<string, Declaration>
) {
    // console.log("variableDeclarationList", variableDeclarationList);
    console.log("-----------------------");
    variableDeclarationList.forEachChild(function (variableDeclaration: ts.VariableDeclaration) {
        // console.log("variableDeclaration", variableDeclaration);
        handleVariableDeclaration(variableDeclaration, variableMap);
    })

}

function handleVariableDeclaration(
    variableDeclaration: ts.VariableDeclaration,
    variableMap: Map<string, Declaration>
) {
    let name = variableDeclaration.name;
    let type = variableDeclaration.type;
    let initializer = variableDeclaration.initializer;

    let nameText: string;
    let typeKind: number;
    let initializerKind: number;

    if (ts.isIdentifier(name)) {
        nameText = name.escapedText.toString();
    } else {
        console.log("Can't handle this type of VariableDeclaration.Name, so skip it");
        return;
    }

    if (type) {
        typeKind = type.kind;

        if (ts.isTypeReferenceNode(type)) {
            let typeReferenceNode = <ts.TypeReferenceNode>type;
            let typeName = typeReferenceNode.typeName;

            if (ts.isIdentifier(typeName)) {
                let typeNameText: string = typeName.escapedText.toString();

                // track this variable if it's type is imported
                checkTypeAndTrackVariable(typeNameText, nameText, variableDeclaration, variableMap);
            } else {
                console.error(typeName);
                throw "typeName is not an Identifier";
            }
        }
    }
    if (initializer) {
        initializerKind = initializer.kind;

        if (ts.isNewExpression(initializer)) {
            let newExpression = <ts.NewExpression>initializer;

            if (ts.isIdentifier(newExpression.expression)) {
                let identifier = <ts.Identifier>newExpression.expression;
                let typeNameText = identifier.escapedText.toString();

                // track this variable because it's a NewExpression of an imported type
                checkTypeAndTrackVariable(typeNameText, nameText, variableDeclaration, variableMap);
            }
        } else if (ts.isPropertyAccessExpression(initializer)) {
            let typeNameText = handlePropertyAccessExpression(<ts.PropertyAccessExpression>initializer, variableMap);

            if (typeNameText) {
                // track if this is not an primitive type
                checkTypeAndTrackVariable(typeNameText, nameText, variableDeclaration, variableMap);
            }
        } else if (ts.isCallExpression(initializer)) {
            let typeNameText = handleCallExpression(<ts.CallExpression>initializer, variableMap);

            // track this variable if it's type is imported
            checkTypeAndTrackVariable(typeNameText, nameText, variableDeclaration, variableMap);
        } else {
            console.log("initializer is neither a NewExpression nor a PropertyAccessExpression, maybe handle this later");
        }
    }

    // console.log(`#\n Name: ${nameText}, \n TypeKind: ${ts.SyntaxKind[typeKind]} (${typeKind}), \n Initializer: ${ts.SyntaxKind[initializerKind]} (${initializerKind})`);
}

function handleCallExpression(
    callExpression: ts.CallExpression,
    variableMap: Map<string, Declaration>
): string {
    let expression = callExpression.expression;

    if (ts.isPropertyAccessExpression(expression)) {
        return handlePropertyAccessExpression(expression, variableMap);
    } else if (ts.isIdentifier(expression)) {
        //TODO: look for declaration of this function and check the return type
    } else {
        console.error(expression);
        throw "callExpression.expression is not a PropertyAccessExpression";
    }
}

function handlePropertyAccessExpression(
    propertyAccessExpression: ts.PropertyAccessExpression,
    variableMap: Map<string, Declaration>
): string {
    let expression = propertyAccessExpression.expression;
    let propertyName = propertyAccessExpression.name.escapedText.toString();

    if (ts.isIdentifier(expression)) {
        let identifier = <ts.Identifier>expression;
        let name = identifier.escapedText.toString();
        let externalVariable = variableMap.get(name);

        if (externalVariable) { //TODO: handle internal calls with external type return
            // Left side of property call is an external (object)
            let typeName = externalVariable.reference || name;
            return checkForPropertyCallOnImportedObject(typeName, propertyName, variableMap);
        }

    } else if (ts.isCallExpression(expression)) {
        let typeName = handleCallExpression(expression, variableMap);

        if (typeName) {
            return checkForPropertyCallOnImportedObject(typeName, propertyName, variableMap);
        }

    } else if (ts.isNewExpression(expression)) {
        let identifier = <ts.Identifier>expression.expression;
        let typeNameText = identifier.escapedText.toString();

        return checkForPropertyCallOnImportedObject(typeNameText, propertyName, variableMap);
    } else {
        console.error(propertyAccessExpression);
        throw "propertyAccessExpression.expression type is not handled";
    }
}

function checkForPropertyCallOnImportedObject( //FixMe: i'm ugly
    typeName: string,
    propertyName: string,
    variableMap: Map<string, Declaration>
) {
    let type = <ImportDeclaration>variableMap.get(typeName);
    let exportScanner = type.exportScanner;
    let propertyDeclaration = <PropertyDeclaration>exportScanner.exportNodesMap.get(typeName).getMembers().get(propertyName);

    if (propertyDeclaration) { // TODO: count this as a successful call
        console.log("propertyDeclaration", propertyDeclaration);
        console.log("HERE IS A PROPERTY CALL ON AN IMPORTED TYPE", `<${typeName}>.${propertyName}`);
    }
    return propertyDeclaration.getType();
}

function checkTypeAndTrackVariable(
    typeNameText: string,
    nameText: string,
    node: ts.Node,
    variableMap: Map<string, Declaration>
) {
    let variableReference = variableMap.get(typeNameText);

    if (variableReference) { // track variable
        let declaration = new Declaration(node);
        declaration.reference = typeNameText;
        variableMap.set(nameText, declaration);
    }
}

/**
 *  TRASH
 */

/**
 * @deprecated
 * @param expression
 * @param variableMap
 */
// function findMeTheTypeRek(expression: ts.Node, variableMap): string {
//     if (ts.isCallExpression(expression)) {
//         let callExpression = <ts.CallExpression>expression;
//
//         assert(ts.isPropertyAccessExpression(callExpression.expression), "it's not a PropertyAccessExpression");
//
//         let propertyAccessExpression = <ts.PropertyAccessExpression>callExpression.expression;
//
//         console.log("propertyAccessExpression", propertyAccessExpression);
//         let propertyName = propertyAccessExpression.name.escapedText.toString();
//
//         let typeName = findMeTheTypeRek(propertyAccessExpression.expression, variableMap);
//         if (typeName) {
//
//             let type = variableMap.get(typeName);
//             if (type) {
//
//                 let exportScanner = type.exportScanner;
//                 let propertyDeclaration = <PropertyDeclaration>exportScanner.exportNodesMap.get(typeName).getMembers().get(propertyName);
//
//                 if (propertyDeclaration) { // count this as a successful call
//                     console.log("HERE IS A PROPERTY CALL ON AN IMPORTED OBJECT");
//                 }
//
//                 // @ts-ignore
//                 let retType = propertyDeclaration.node.type.type.typeName.escapedText;
//                 // console.log("retType", retType);
//                 if (retType) { //TODO: implement not void and any types
//                     return retType;
//                 }
//             }
//             // console.log("typeName", typeName);
//             // console.log("type", type);
//             // console.log("exportScanner", exportScanner);
//             // console.log("exportNodesMap", exportScanner.exportNodesMap);
//             // console.log("exportNodesMap.get(typeName)", exportScanner.exportNodesMap.get(typeName));
//             // console.log(".getMembers()", exportScanner.exportNodesMap.get(typeName).getMembers());
//             // console.log("propertyDeclaration", propertyDeclaration);
//
//         }
//
//         //TODO: type.getProperties().has(expression.name)
//         // if yes, then get type of that property and return it, else, cant handle this
//
//         // console.log("type", type);
//
//     } else if (ts.isIdentifier(expression)) {
//         let identifier = <ts.Identifier>expression;
//         let name = identifier.escapedText.toString();
//         let variable = variableMap.get(name);
//
//         return variable.reference || name;
//     } else {
//         console.log("it's not a CallExpression or an Identifier: do something about it");
//     }
// }
//
// surfaceCountWrapper() {
//     this.surfaceCountRek(this.source);
//     console.log("counts", this._counts);
// }
//
// surfaceCountRek(node: ts.Node) {
//
//     node.forEachChild(child => {
//         switch (child.kind) {
//             case ts.SyntaxKind.ImportDeclaration:
//                 let importDeclaration = new ImportDeclaration(child);
//                 let importSpecifiers = importDeclaration.getImportSpecifiers();
//
//                 importSpecifiers.forEach(function (value: string) {
//                     this.importMap.set(value, importDeclaration);
//                 }.bind(this));
//
//                 break;
//
//             case ts.SyntaxKind.Identifier:
//                 let text: string = <string>(<ts.Identifier>child).escapedText;
//                 let imprt = this.importMap.get(text);
//
//                 if (imprt) {
//                     let n = this._counts.get(text);
//                     this._counts.set(text, n + 1 || 1);
//                 }
//
//                 break;
//
//             default:
//                 this.surfaceCountRek(child);
//
//                 break;
//         }
//     });
// }