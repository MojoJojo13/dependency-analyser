import * as ts from "typescript";
import * as path from "path";
import {Declaration, ImportDeclaration} from "./Declarations";
import {DependencyAnalyser} from "./DependencyAnalyser";
import {printChildren} from "./util";

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
    }

    scanSource(node: ts.Node) {
        let that = this;

        node.forEachChild(child => {
            switch (child.kind) {
                case ts.SyntaxKind.ImportDeclaration:
                    let importDeclaration = new ImportDeclaration(child);
                    let importSpecifiers = importDeclaration.getImportSpecifiers();

                    // find and set the SourceFile
                    let importSpecifier = importDeclaration.getModuleSpecifier();

                    // is it a local module which starts with '../ or './'
                    if (RegExp('^(\\.\\.\\/)|^(\\.\\/)').test(importSpecifier)) {
                        const dtsFileName = path.join(path.dirname(this.fileName), importSpecifier) + ".d.ts";
                        let sourceFile = this.dependencyAnalyser.dtsCreator.exportSourceFileMap.get(dtsFileName);

                        console.assert(sourceFile, "SourceFile not found or not existing");

                        importDeclaration.sourceFile = sourceFile;
                    } else {

                        let sourceFile = this.dependencyAnalyser.getModuleSourceFile(importSpecifier);
                        if (!sourceFile) return; // TODO: Cant' handle default imports
                        importDeclaration.sourceFile = sourceFile;

                        // FUN WITH COUNT
                        console.log("sourceFile.getCountMemberMap()", sourceFile.getCountMemberMap());

                    }

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
    } else {
        console.error(propertyAccessExpression);
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