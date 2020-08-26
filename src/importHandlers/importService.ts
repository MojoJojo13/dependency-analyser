import * as ts from "typescript";
import * as path from "path";
import {DependencyAnalyser} from "../main/dependencyAnalyser";
import {ImportCount} from "../presentation/importCount";
import {UsageCount} from "../presentation/usageCount";
import {ImportDeclaration} from "./importDeclaration";
import {Declaration} from "./declaration";
import {printChildren} from "../util/util";

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
                case ts.SyntaxKind.FunctionExpression:
                    this.handleFunctionDeclaration(child as ts.FunctionDeclaration | ts.ArrowFunction | ts.FunctionExpression);
                    break;

                case ts.SyntaxKind.Block:
                    this.handleBlock(child);
                    break;

                case ts.SyntaxKind.EndOfFileToken: // Ignore
                    break;

                case ts.SyntaxKind.Identifier:
                    const identifier = child as ts.Identifier;
                    const name = identifier.escapedText.toString();
                    const importDeclaration = this.findImportDeclaration(name);

                    if (importDeclaration) {
                        const usageCount = new UsageCount(this.fileName, importDeclaration, identifier);
                        this.dependencyAnalyser.countService.addUsageCount(usageCount);
                    }

                    break;

                default:
                    this.scanSource(child);
                    break;
            }
        })
    }

    /**
     * Saves ImportDeclarations in an array to lookup when used.
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

        importSpecifiers.forEach((value: string) => {
            this.importMap.set(value, importDeclaration);
        });
    }

    /**
     * Creates a new scope around the node.
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
     */
    private handleDeclaration(declaration: Declarations) {
        const name = declaration.name;

        if (ts.isIdentifier(name)) {
            const nameText = name.escapedText.toString();

            if (Array.from(this.importMap.keys()).some(value => value === nameText)) {
                const lastElement = this._importOverrideMapArray[this._importOverrideMapArray.length - 1];
                lastElement.set(nameText, new Declaration(declaration));
            }

        }
    }

    /**
     * Splits FunctionDeclaration in parts to handle the scope
     */
    private handleFunctionDeclaration(functionDeclaration: ts.FunctionDeclaration | ts.ArrowFunction | ts.FunctionExpression) {

        // only FunctionDeclarations have a name which has to be handled
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
     * Searches and returns the ImportDeclaration. If it's overridden return undefined.
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