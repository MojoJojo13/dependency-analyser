"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImportScanner = void 0;
const ts = require("typescript");
const path = require("path");
const importCount_1 = require("../presentation/importCount");
const usageCount_1 = require("../presentation/usageCount");
const importDeclaration_1 = require("./importDeclaration");
const declaration_1 = require("./declaration");
/**
 * Class to scan the AST tree of a TypeScript file and count dependency usages.
 */
class ImportScanner {
    constructor(dependencyAnalyser, fileName, source) {
        this._importMap = new Map();
        this._importOverrideMapArray = [];
        this.dependencyAnalyser = dependencyAnalyser;
        this.fileName = fileName;
        this.source = source;
        // printChildren(source); // DEBUG
        // console.log("-------------------");
        this.scanSource(source);
    }
    get dependencyAnalyser() {
        return this._dependencyAnalyser;
    }
    set dependencyAnalyser(value) {
        this._dependencyAnalyser = value;
    }
    get fileName() {
        return this._fileName;
    }
    set fileName(value) {
        this._fileName = value;
    }
    get source() {
        return this._source;
    }
    set source(value) {
        this._source = value;
    }
    get importMap() {
        return this._importMap;
    }
    set importMap(value) {
        this._importMap = value;
    }
    /**
     * Goes through the AST tree created by TypeScript and handles the different nodes.
     */
    scanSource(node) {
        node.forEachChild(child => {
            switch (child.kind) {
                case ts.SyntaxKind.ImportDeclaration:
                    this.handleImportDeclaration(child);
                    break;
                case ts.SyntaxKind.VariableDeclarationList:
                    this.handleVariableDeclarationList(child);
                    this.scanSource(child);
                    break;
                case ts.SyntaxKind.ClassDeclaration:
                case ts.SyntaxKind.EnumDeclaration:
                    this.handleDeclaration(child);
                    this.scanSource(child);
                    break;
                case ts.SyntaxKind.ArrowFunction:
                case ts.SyntaxKind.FunctionDeclaration:
                case ts.SyntaxKind.FunctionExpression:
                    this.handleFunctionDeclaration(child);
                    break;
                case ts.SyntaxKind.Block:
                    this.handleBlock(child);
                    break;
                case ts.SyntaxKind.EndOfFileToken: // Ignore
                    break;
                case ts.SyntaxKind.Identifier:
                    const identifier = child;
                    const name = identifier.escapedText.toString();
                    const importDeclaration = this.findImportDeclaration(name);
                    if (importDeclaration) {
                        const usageCount = new usageCount_1.UsageCount(this.fileName, importDeclaration, identifier);
                        this.dependencyAnalyser.countService.addUsageCount(usageCount);
                    }
                    break;
                default:
                    this.scanSource(child);
                    break;
            }
        });
    }
    /**
     * Saves ImportDeclarations in an array to lookup when used.
     */
    handleImportDeclaration(node) {
        const importDeclaration = new importDeclaration_1.ImportDeclaration(node);
        const importSpecifiers = importDeclaration.getImportSpecifiers();
        const moduleSpecifier = importDeclaration.getModuleSpecifier();
        try {
            const options = { paths: [this.dependencyAnalyser.options.nodeModulesDir] };
            const modulePath = require.resolve(importDeclaration.getModuleSpecifier(), options);
            const isNodeModule = !path.isAbsolute(modulePath);
            // filter out custom modules
            if (RegExp('^(\\.\\.|\\.)(\\/)').test(moduleSpecifier)) {
                return;
            }
            const importCount = new importCount_1.ImportCount(this.fileName, importDeclaration, this.source, isNodeModule);
            this.dependencyAnalyser.countService.addImportCount(importCount);
        }
        catch (err) {
            // Module could not be resolved, so skip it
            return;
        }
        importSpecifiers.forEach((value) => {
            this.importMap.set(value, importDeclaration);
        });
    }
    /**
     * Creates a new scope around the node.
     */
    handleBlock(node) {
        this.handleBlockStart();
        this.scanSource(node);
        this.handleBlockEnd();
    }
    /**
     * Opens a scope by creating a new map for declarations.
     */
    handleBlockStart() {
        this._importOverrideMapArray.push(new Map());
    }
    /**
     * Closes the last open scope by removing the last map of declarations.
     */
    handleBlockEnd() {
        this._importOverrideMapArray.pop();
    }
    /**
     * Iterates through the VariableDeclarationList and handles every declaration.
     */
    handleVariableDeclarationList(variableDeclarationList) {
        variableDeclarationList.forEachChild(variableDeclaration => {
            this.handleDeclaration(variableDeclaration);
        });
    }
    /**
     * Saves a declaration into the current scope.
     */
    handleDeclaration(declaration) {
        const name = declaration.name;
        if (ts.isIdentifier(name)) {
            const nameText = name.escapedText.toString();
            if (Array.from(this.importMap.keys()).some(value => value === nameText)) {
                const lastElement = this._importOverrideMapArray[this._importOverrideMapArray.length - 1];
                lastElement.set(nameText, new declaration_1.Declaration(declaration));
            }
        }
    }
    /**
     * Splits FunctionDeclaration in parts to handle the scope
     */
    handleFunctionDeclaration(functionDeclaration) {
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
    findImportDeclaration(name) {
        if (this._importOverrideMapArray.some(importOverrideMap => {
            return Array.from(importOverrideMap.keys()).some(importKey => importKey === name);
        })) {
            return undefined;
        }
        return this.importMap.get(name);
    }
}
exports.ImportScanner = ImportScanner;
//# sourceMappingURL=importService.js.map