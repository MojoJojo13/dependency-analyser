import * as ts from "typescript";
import * as path from "path";
import {Declaration, ImportDeclaration} from "./Declarations";
import {DependencyAnalyser} from "./DependencyAnalyser";
import {printChildren} from "./util";
import {ImportCount, UsageCount} from "./presentation/Counter";
import {forEachChild} from "typescript";

type Declarations =
    ts.ClassDeclaration
    | ts.VariableDeclaration
    | ts.EnumDeclaration
    | ts.FunctionDeclaration
    | ts.ParameterDeclaration
    | ts.ArrowFunction;

export class ImportScanner {

    private _dependencyAnalyser: DependencyAnalyser;
    private _fileName: string;
    private _source: ts.SourceFile;
    private _importMap = new Map<string, ImportDeclaration>();
    importOverrideMapArray: Map<string, Declaration>[] = [];
    private _variableMap = new Map<string, Declaration>();
    private _counts = new Map<string, number>();

    constructor(dependencyAnalyser: DependencyAnalyser, fileName: string, source: ts.SourceFile) {
        this.dependencyAnalyser = dependencyAnalyser;
        this.fileName = fileName;
        this.source = source;

        // printChildren(source);
        // console.log("-------------------");
        // console.log("fileName", fileName);
        this.scanSource(source, null, source);
        // console.log("-------------------");

        // console.log("this.dependencyAnalyser.countService.usageCounts", this.dependencyAnalyser.countService.usageCounts);
    }

    scanSource(node: ts.Node, parentNode: ts.Node, sourceFile: ts.SourceFile) {
        // const that = this;
        if (!node) console.error(node, parentNode);
        node.forEachChild(child => {
            switch (child.kind) {
                case ts.SyntaxKind.ImportDeclaration:
                    handleImportDeclaration(this, child, sourceFile);
                    break;

                case ts.SyntaxKind.VariableDeclarationList:
                    // handleVariableDeclarationList(child as ts.VariableDeclarationList, this.importMap);
                    this.handleVariableDeclarationList(child as ts.VariableDeclarationList);
                    // this.scanSource(child, node, sourceFile);
                    break;

                case ts.SyntaxKind.ClassDeclaration:
                case ts.SyntaxKind.EnumDeclaration:
                    this.handleDeclaration(child as Declarations);
                    // this.scanSource(child, node, sourceFile);
                    break;

                case ts.SyntaxKind.ArrowFunction:
                case ts.SyntaxKind.FunctionDeclaration:
                    this.handleFunctionDeclaration(child as ts.FunctionDeclaration | ts.ArrowFunction);
                    break;

                // case ts.SyntaxKind.PropertyAccessExpression:
                //     handlePropertyAccessExpression(child as ts.PropertyAccessExpression, this.importMap);
                //     break;
                //
                // case ts.SyntaxKind.CallExpression:
                //     handleCallExpression(child as ts.CallExpression, this.importMap);
                //     break;
                //
                // case ts.SyntaxKind.ImportEqualsDeclaration: // Not supported for now
                //     console.error(`Not supported: ${ts.SyntaxKind[child.kind]} (${child.kind})`);
                //     break;
                //

                case ts.SyntaxKind.Block:
                    this.handleBlock(child, node, sourceFile);
                    break;

                case ts.SyntaxKind.EndOfFileToken: // Ignore
                    break;

                case ts.SyntaxKind.Identifier:
                    const identifier = child as ts.Identifier;
                    const name = identifier.escapedText.toString();
                    // console.log("-> name", name);
                    // const importDeclaration = this.importMap.get(name);
                    const importDeclaration = this.findImportDeclaration(name);
                    // console.log("importDeclaration", importDeclaration);

                    if (importDeclaration && importDeclaration.isDependency) { //  && importDeclaration.isDependency
                        const usageCount = new UsageCount(this.fileName, importDeclaration, identifier);
                        // console.log("#", usageCount);
                        this.dependencyAnalyser.countService.addUsageCount(usageCount);
                    }

                    break;

                default:
                    // console.log(`Can't handle this: ${ts.SyntaxKind[child.kind]} (${child.kind})`);
                    this.scanSource(child, node, sourceFile);
                    break;
            }
        })

        //console.log("this.importMap", this.importMap);
    }

    private handleImportDeclaration() {

    }

    private handleBlock(child: ts.Node, node: ts.Node, sourceFile: ts.SourceFile) {
        this.handleBlockStart();
        this.scanSource(child, node, sourceFile);
        this.handleBlockEnd();
    }

    private handleBlockStart() {
        this.importOverrideMapArray.push(new Map<string, Declaration>());
    }

    private handleBlockEnd() {
        this.importOverrideMapArray.pop();
        // console.log("A", this.importOverrideMapArray.pop());
    }

    private handleVariableDeclarationList(
        variableDeclarationList: ts.VariableDeclarationList,
        // variableMap: Map<string, Declaration>
    ) {
        // console.log("variableDeclarationList", variableDeclarationList);
        // console.log("-----------------------")
        variableDeclarationList.forEachChild(variableDeclaration => {
            // console.log("variableDeclaration", variableDeclaration);
            // this.handleVariableDeclaration(variableDeclaration as ts.VariableDeclaration);
            // console.log("variableDeclaration", variableDeclaration);
            this.handleDeclaration(variableDeclaration as ts.VariableDeclaration);
        });

    }

    private handleDeclaration(declaration: Declarations) {
        let name = declaration.name;
        if (ts.isIdentifier(name)) {
            const nameText = name.escapedText.toString();
            // console.log("nameText", nameText);

            if (Array.from(this.importMap.keys()).some(value => value === nameText)) {
                // console.log("IMPORT OVERRIDE!");
                const lastElement = this.importOverrideMapArray[this.importOverrideMapArray.length - 1];
                lastElement.set(nameText, new Declaration(declaration));
            }

        } else {
            console.log("Can't handle this type of VariableDeclaration.Name, so skip it");
        }

        this.scanSource(declaration, null, null);

        // declaration.forEachChild(child => {
        //     this.scanSource(child, null, null);
        //     console.log("child", child);
        // })

    }

    private handleFunctionDeclaration(functionDeclaration: ts.FunctionDeclaration | ts.ArrowFunction) {
        // console.log("functionDeclaration", functionDeclaration);

        if (ts.isFunctionDeclaration(functionDeclaration)) {
            // ArrowFunctions are no Declarations and don't have names
            this.handleDeclaration(functionDeclaration);
        }

        this.handleBlockStart();

        functionDeclaration.parameters.forEach(parameter => this.handleDeclaration(parameter));

        if (functionDeclaration.body) {
            this.scanSource(functionDeclaration.body, null, null);
        }

        this.handleBlockEnd();
    }

    private findImportDeclaration(name: string) {
        if (this.importOverrideMapArray.some(importOverrideMap => {
            return Array.from(importOverrideMap.keys()).some(importKey => importKey === name);
        })) {
            return undefined;
        }

        return this.importMap.get(name);
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

function handleImportDeclaration(that: ImportScanner, node: ts.Node, sourceFile: ts.SourceFile) {
    const importDeclaration = new ImportDeclaration(node);
    const importSpecifiers = importDeclaration.getImportSpecifiers();

    // find and set the SourceFile
    const importSpecifier = importDeclaration.getModuleSpecifier();

    // is it a local module, which starts with '../' or './' ?
    // if (RegExp('^(\\.\\.|\\.)(\\/)').test(importSpecifier)) {

    try {
        const options = {paths: [that.dependencyAnalyser.options.nodeModulesDir]};
        const modulePath = require.resolve(importDeclaration.getModuleSpecifier(), options);
        const isNodeModule = !path.isAbsolute(modulePath);

        if (RegExp('^(\\.\\.|\\.)(\\/)').test(importSpecifier)) {
            handleCustomImport();
            return;
        }

        // let sourceFile1 = this.dependencyAnalyser.getModuleSourceFile(importSpecifier);
        // importDeclaration.sourceFile = sourceFile1; // FixMe: trouble with resolving

        let importCount = new ImportCount(that.fileName, importDeclaration, sourceFile, isNodeModule, false);
        that.dependencyAnalyser.countService.addImportCount(importCount);

        importDeclaration.isDependency = true;

        // FUN WITH COUNT
        // console.log("sourceFile.getCountMemberMap()", sourceFile.getCountMemberMap());
    } catch (err) {
        // console.error("Error in file: ", this.fileName);
        // console.error(err);

        handleCustomImport();
    }

    if (importSpecifiers.length === 0 && importDeclaration.getModuleSpecifier() !== "") {
        console.log("importDeclaration.getModuleSpecifier()", importDeclaration.getModuleSpecifier());

        //TODO: do something with: import "./simpleExports"
    }

    // TODO: follow only dependencies
    importSpecifiers.forEach(function (value: string) {
        that.importMap.set(value, importDeclaration);
    }.bind(this));

    function handleCustomImport() {
        const dtsFileName = path.join(path.dirname(that.fileName), importSpecifier) + ".d.ts";
        const sourceFile = that.dependencyAnalyser.dtsCreator.exportSourceFileMap.get(dtsFileName);

        // console.assert(sourceFile, "SourceFile not found or not existing");
        if (sourceFile) {
            importDeclaration.sourceFile = sourceFile;
        } else {
            console.error("No source File found!");
        }

        // NEEDS TO BE HANDLED SEPARATELY
        // let importCount = new ImportCount(this.fileName, importDeclaration, undefined, false, true);
        // this.dependencyAnalyser.countService.addImportCount(importCount);
    }
}

function handleVariableDeclarationList(
    variableDeclarationList: ts.VariableDeclarationList,
    variableMap: Map<string, Declaration>
) {
    // console.log("variableDeclarationList", variableDeclarationList);
    console.log("-----------------------");
    variableDeclarationList.forEachChild(variableDeclaration => {
        // console.log("variableDeclaration", variableDeclaration);
        handleVariableDeclaration(variableDeclaration as ts.VariableDeclaration, variableMap);
    });

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
        console.log("nameText", nameText);

        if (Array.from(variableMap.keys()).some(value => value === nameText)) {
            console.log("DUPLICATE!");
        }

    } else {
        console.log("Can't handle this type of VariableDeclaration.Name, so skip it");
        return;
    }


    // if (type) {
    //     typeKind = type.kind;
    //
    //     if (ts.isTypeReferenceNode(type)) {
    //         let typeName = type.typeName;
    //
    //         if (ts.isIdentifier(typeName)) {
    //             let typeNameText: string = typeName.escapedText.toString();
    //
    //             // track this variable if it's type is imported
    //             checkTypeAndTrackVariable(typeNameText, nameText, variableDeclaration, variableMap);
    //         }
    //             // else if (ts.isQualifiedName(typeName)) {
    //             //
    //         // }
    //         else {
    //             console.error(typeName);
    //             throw Error(`typeName is not an Identifier`);
    //         }
    //     } else if (ts.isTupleTypeNode(type)) {
    //         // TODO: handle Tuples
    //     } else if (ts.isArrayTypeNode(type)) {
    //         // TODO: handle Arrays
    //         console.log("type", type);
    //
    //         if (ts.isTypeReferenceNode(type.elementType)) {
    //             console.log("type.elementType", type.elementType);
    //             let typeName = type.elementType.typeName;
    //
    //             if (ts.isIdentifier(typeName)) {
    //                 let typeNameText: string = typeName.escapedText.toString();
    //
    //                 // track this variable if it's type is imported
    //                 checkTypeAndTrackVariable(typeNameText, nameText, variableDeclaration, variableMap);
    //             }
    //         } else {
    //             console.error(`type is a not a ReferenceTypeNode: ${ts.SyntaxKind[type.elementType.kind]} (${type.elementType.kind})`);
    //         }
    //
    //     } else {
    //         // ignore simple types for now
    //         console.error(`type is a Simple Type: ${ts.SyntaxKind[type.kind]} (${type.kind})`);
    //         // console.error(type);
    //         // throw Error(`type is not a ReferenceNode: ${ts.SyntaxKind[type.kind]} (${type.kind})`);
    //     }
    // }

    // if (initializer) {
    //     initializerKind = initializer.kind;
    //
    //     if (ts.isNewExpression(initializer)) {
    //         let newExpression = <ts.NewExpression>initializer;
    //
    //         if (ts.isIdentifier(newExpression.expression)) {
    //             let identifier = <ts.Identifier>newExpression.expression;
    //             let typeNameText = identifier.escapedText.toString();
    //
    //             // track this variable because it's a NewExpression of an imported type
    //             checkTypeAndTrackVariable(typeNameText, nameText, variableDeclaration, variableMap);
    //         }
    //     } else if (ts.isPropertyAccessExpression(initializer)) {
    //         let typeNameText = handlePropertyAccessExpression(<ts.PropertyAccessExpression>initializer, variableMap);
    //
    //         if (typeNameText) {
    //             // track if this is not an primitive type
    //             checkTypeAndTrackVariable(typeNameText, nameText, variableDeclaration, variableMap);
    //         }
    //     } else if (ts.isCallExpression(initializer)) {
    //         let typeNameText = handleCallExpression(<ts.CallExpression>initializer, variableMap);
    //
    //         // track this variable if it's type is imported
    //         checkTypeAndTrackVariable(typeNameText, nameText, variableDeclaration, variableMap);
    //     } else {
    //         console.log("initializer is neither a NewExpression nor a PropertyAccessExpression, maybe handle this later");
    //     }
    // }

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

        if (externalVariable) { // TODO: handle internal calls with external type return
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
    } else if (ts.isElementAccessExpression(expression)) {
        console.log("expression", expression);
    } else {
        console.error(expression);
        throw Error("propertyAccessExpression.expression type is not handled");
    }
}

function checkForPropertyCallOnImportedObject(
    typeName: string,
    propertyName: string,
    variableMap: Map<string, Declaration>
) {
    let type = <ImportDeclaration>variableMap.get(typeName);
    let propertyReturnType: string;
    let typeDeclarationArray = type.sourceFile.getMemberMap().get(typeName);

    typeDeclarationArray.forEach(typeDeclaration => {
        let propertyDeclarationArray = typeDeclaration.getMemberMap().get(propertyName);

        propertyDeclarationArray.forEach(propertyDeclaration => {
            let propertyDeclarationType = propertyDeclaration.getType();

            if (propertyDeclarationType) {
                console.log("HERE IS A PROPERTY CALL ON AN IMPORTED TYPE", `<${typeName}>.${propertyName}`);
            }

            propertyReturnType = propertyDeclarationType.getName();
        })
    })

    return propertyReturnType;
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