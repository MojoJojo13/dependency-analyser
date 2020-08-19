import * as ts from "typescript";
import * as path from "path";
import {Declaration, ImportDeclaration, RequireDeclaration} from "./Declarations";
import {DependencyAnalyser} from "./DependencyAnalyser";
import {printChildren} from "./util";
import {ImportCount, UsageCount} from "./presentation/Counter";

type Declarations =
    ts.ClassDeclaration
    | ts.VariableDeclaration
    | ts.EnumDeclaration
    | ts.FunctionDeclaration
    | ts.ParameterDeclaration
    | ts.ArrowFunction;

/**
 * Class to scan the AST tree of a TypeScript file and count dependency usages.
 */
export class ImportScanner {
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

    get importMap(): Map<string, ImportDeclaration> {
        return this._importMap;
    }

    set importMap(value: Map<string, ImportDeclaration>) {
        this._importMap = value;
    }

    private _dependencyAnalyser: DependencyAnalyser;
    private _fileName: string;
    private _source: ts.SourceFile;
    private _importMap = new Map<string, ImportDeclaration>();
    private _importOverrideMapArray: Map<string, Declaration>[] = [];

    constructor(dependencyAnalyser: DependencyAnalyser, fileName: string, source: ts.SourceFile) {
        this.dependencyAnalyser = dependencyAnalyser;
        this.fileName = fileName;
        this.source = source;

        // printChildren(source); // DEBUG
        // console.log("-------------------");
        this.scanSource(source);
    }

    /**
     * Goes through the AST tree created by TypeScript and handles the different nodes.
     * @param node
     */
    scanSource(node: ts.Node) {

        node.forEachChild(child => {
            switch (child.kind) {
                case ts.SyntaxKind.ImportDeclaration:
                    this.handleImportDeclaration(child as ts.ImportDeclaration);
                    break;

                case ts.SyntaxKind.VariableDeclarationList:
                    this.handleVariableDeclarationList(child as ts.VariableDeclarationList);
                    this.scanSource(child);
                    break;

                case ts.SyntaxKind.ClassDeclaration:
                case ts.SyntaxKind.EnumDeclaration:
                    this.handleDeclaration(child as Declarations);
                    this.scanSource(child);
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
                    this.handleBlock(child);
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

                    if (importDeclaration) { //  && importDeclaration.isDependency
                        const usageCount = new UsageCount(this.fileName, importDeclaration, identifier);
                        // console.log("#", usageCount);
                        this.dependencyAnalyser.countService.addUsageCount(usageCount);
                    }

                    break;

                default:
                    this.scanSource(child);
                    break;
            }
        })

        //console.log("this.importMap", this.importMap);
    }

    /**
     * Saves ImportDeclarations in an array to lookup when used.
     * @param node
     */
    private handleImportDeclaration(node: ts.ImportDeclaration) {
        const importDeclaration = new ImportDeclaration(node);
        const importSpecifiers = importDeclaration.getImportSpecifiers();
        const moduleSpecifier = importDeclaration.getModuleSpecifier();

        try {
            const options = {paths: [this.dependencyAnalyser.options.nodeModulesDir]};
            const modulePath = require.resolve(importDeclaration.getModuleSpecifier(), options);
            const isNodeModule = !path.isAbsolute(modulePath);

            // filter out custom modules
            if (RegExp('^(\\.\\.|\\.)(\\/)').test(moduleSpecifier)) {
                return;
            }

            const importCount = new ImportCount(this.fileName, importDeclaration, this.source, isNodeModule);
            this.dependencyAnalyser.countService.addImportCount(importCount);
        } catch (err) {
            // Module could not be resolved, so skip it
            return;
        }

        // if (importSpecifiers.length === 0 && importDeclaration.getModuleSpecifier() !== "") {
        //     //TODO: include simple imports e.g. 'import "./simpleExports"'
        // }

        importSpecifiers.forEach((value: string) => {
            this.importMap.set(value, importDeclaration);
        });
    }

    /**
     * Creates a new scope around the node.
     * @param node
     */
    private handleBlock(node: ts.Node) {
        this.handleBlockStart();
        this.scanSource(node);
        this.handleBlockEnd();
    }

    /**
     * Opens a scope by creating a new map for declarations.
     */
    private handleBlockStart() {
        this._importOverrideMapArray.push(new Map<string, Declaration>());
    }

    /**
     * Closes the last open scope by removing the last map of declarations.
     */
    private handleBlockEnd() {
        this._importOverrideMapArray.pop();
    }

    /**
     * Iterates through the VariableDeclarationList and handles every declaration.
     * @param variableDeclarationList
     */
    private handleVariableDeclarationList(
        variableDeclarationList: ts.VariableDeclarationList,
    ) {
        variableDeclarationList.forEachChild(variableDeclaration => {
            this.handleDeclaration(variableDeclaration as ts.VariableDeclaration);
        });
    }

    /**
     * Saves a declaration into the current scope.
     * @param declaration
     */
    private handleDeclaration(declaration: Declarations) {
        const name = declaration.name;

        if (ts.isIdentifier(name)) {
            const nameText = name.escapedText.toString();

            if (Array.from(this.importMap.keys()).some(value => value === nameText)) {
                const lastElement = this._importOverrideMapArray[this._importOverrideMapArray.length - 1];
                lastElement.set(nameText, new Declaration(declaration));
            }

        } else {
            // console.log("Can't handle this type of VariableDeclaration.Name, so skip it");
            // console.log(this.source.text.substring(declaration.pos, declaration.end));
            // console.log()
            //TODO: handle arrays and tuples
        }
    }

    /**
     * Splits FunctionDeclaration in parts to handle the scope
     * @param functionDeclaration
     */
    private handleFunctionDeclaration(functionDeclaration: ts.FunctionDeclaration | ts.ArrowFunction) {

        // ArrowFunctions are no Declarations and don't have names
        if (ts.isFunctionDeclaration(functionDeclaration)) {
            this.handleDeclaration(functionDeclaration);
        }

        this.handleBlockStart();

        functionDeclaration.parameters.forEach(parameter => this.handleDeclaration(parameter));

        if (functionDeclaration.body) {
            this.scanSource(functionDeclaration.body);
        }

        this.handleBlockEnd();
    }

    /**
     * @deprecated
     * @param variableDeclaration
     */
    private handleRequireModule(variableDeclaration: ts.VariableDeclaration) {
        let initializer = variableDeclaration.initializer;

        if (initializer && ts.isAsExpression(initializer)) {
            initializer = initializer.expression;
        }

        if (initializer && ts.isCallExpression(initializer)) {
            const identifier = initializer.expression;

            if (ts.isIdentifier(identifier)) {

                if (identifier.originalKeywordKind === ts.SyntaxKind.RequireKeyword) {
                    const requireDeclaration = new RequireDeclaration(variableDeclaration);
                    // const importSpecifiers = requireDeclaration.getImportSpecifiers();
                    const moduleSpecifier = requireDeclaration.getModuleSpecifier();

                    try {
                        const options = {paths: [this.dependencyAnalyser.options.nodeModulesDir]};
                        const modulePath = require.resolve(moduleSpecifier, options);
                        const isNodeModule = !path.isAbsolute(modulePath);

                        if (RegExp('^(\\.\\.|\\.)(\\/)').test(moduleSpecifier)) {
                            return;
                        }

                        let importCount = new ImportCount(this.fileName, requireDeclaration, this.source, isNodeModule);
                        this.dependencyAnalyser.countService.addImportCount(importCount);

                    } catch (err) {
                        console.error("Could not find module:", moduleSpecifier);
                    }
                }
            }
        }
    }

    /**
     * Searches and returns the ImportDeclaration. If it's overridden return undefined.
     * @param name
     */
    private findImportDeclaration(name: string): ImportDeclaration | undefined {
        if (this._importOverrideMapArray.some(importOverrideMap => {
            return Array.from(importOverrideMap.keys()).some(importKey => importKey === name);
        })) {
            return undefined;
        }

        return this.importMap.get(name);
    }

}

/**
 * @deprecated
 * @param that
 * @param node
 * @param sourceFile
 */
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
            // handleCustomImport();
            return;
        }

        // let sourceFile1 = this.dependencyAnalyser.getModuleSourceFile(importSpecifier);
        // importDeclaration.sourceFile = sourceFile1; // FixMe: trouble with resolving

        let importCount = new ImportCount(that.fileName, importDeclaration, sourceFile, isNodeModule);
        that.dependencyAnalyser.countService.addImportCount(importCount);

        // importDeclaration.isDependency = true;

        // FUN WITH COUNT
        // console.log("sourceFile.getCountMemberMap()", sourceFile.getCountMemberMap());
    } catch (err) {
        // console.error("Error in file: ", this.fileName);
        // console.error(err);

        // handleCustomImport();
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

/**
 * @deprecated
 * @param variableDeclarationList
 * @param variableMap
 */
function handleVariableDeclarationList(
    variableDeclarationList: ts.VariableDeclarationList,
    variableMap: Map<string, Declaration>
) {
    variableDeclarationList.forEachChild(variableDeclaration => {
        handleVariableDeclaration(variableDeclaration as ts.VariableDeclaration, variableMap);
    });
}

/**
 * @deprecated
 * @param variableDeclaration
 * @param variableMap
 */
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

    if (type) {
        typeKind = type.kind;

        if (ts.isTypeReferenceNode(type)) {
            let typeName = type.typeName;

            if (ts.isIdentifier(typeName)) {
                let typeNameText: string = typeName.escapedText.toString();

                // track this variable if it's type is imported
                checkTypeAndTrackVariable(typeNameText, nameText, variableDeclaration, variableMap);
            }
                // else if (ts.isQualifiedName(typeName)) {
                //
            // }
            else {
                console.error(typeName);
                throw Error(`typeName is not an Identifier`);
            }
        } else if (ts.isTupleTypeNode(type)) {
            // TODO: handle Tuples
        } else if (ts.isArrayTypeNode(type)) {
            // TODO: handle Arrays
            console.log("type", type);

            if (ts.isTypeReferenceNode(type.elementType)) {
                console.log("type.elementType", type.elementType);
                let typeName = type.elementType.typeName;

                if (ts.isIdentifier(typeName)) {
                    let typeNameText: string = typeName.escapedText.toString();

                    // track this variable if it's type is imported
                    checkTypeAndTrackVariable(typeNameText, nameText, variableDeclaration, variableMap);
                }
            } else {
                console.error(`type is a not a ReferenceTypeNode: ${ts.SyntaxKind[type.elementType.kind]} (${type.elementType.kind})`);
            }

        } else {
            // ignore simple types for now
            console.error(`type is a Simple Type: ${ts.SyntaxKind[type.kind]} (${type.kind})`);
            // console.error(type);
            // throw Error(`type is not a ReferenceNode: ${ts.SyntaxKind[type.kind]} (${type.kind})`);
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

/**
 * @deprecated
 * @param callExpression
 * @param variableMap
 */
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

/**
 * @deprecated
 * @param propertyAccessExpression
 * @param variableMap
 */
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

/**
 * @deprecated
 * @param typeName
 * @param propertyName
 * @param variableMap
 */
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

/**
 * @deprecated
 * @param typeNameText
 * @param nameText
 * @param node
 * @param variableMap
 */
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