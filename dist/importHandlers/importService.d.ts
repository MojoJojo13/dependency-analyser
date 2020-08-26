import * as ts from "typescript";
import { DependencyAnalyser } from "../main/dependencyAnalyser";
import { ImportDeclaration } from "./importDeclaration";
/**
 * Class to scan the AST tree of a TypeScript file and count dependency usages.
 */
export declare class ImportScanner {
    get dependencyAnalyser(): DependencyAnalyser;
    set dependencyAnalyser(value: DependencyAnalyser);
    get fileName(): string;
    set fileName(value: string);
    get source(): ts.SourceFile;
    set source(value: ts.SourceFile);
    get importMap(): Map<string, ImportDeclaration>;
    set importMap(value: Map<string, ImportDeclaration>);
    private _dependencyAnalyser;
    private _fileName;
    private _source;
    private _importMap;
    private _importOverrideMapArray;
    constructor(dependencyAnalyser: DependencyAnalyser, fileName: string, source: ts.SourceFile);
    /**
     * Goes through the AST tree created by TypeScript and handles the different nodes.
     */
    scanSource(node: ts.Node): void;
    /**
     * Saves ImportDeclarations in an array to lookup when used.
     */
    private handleImportDeclaration;
    /**
     * Creates a new scope around the node.
     */
    private handleBlock;
    /**
     * Opens a scope by creating a new map for declarations.
     */
    private handleBlockStart;
    /**
     * Closes the last open scope by removing the last map of declarations.
     */
    private handleBlockEnd;
    /**
     * Iterates through the VariableDeclarationList and handles every declaration.
     */
    private handleVariableDeclarationList;
    /**
     * Saves a declaration into the current scope.
     */
    private handleDeclaration;
    /**
     * Splits FunctionDeclaration in parts to handle the scope
     */
    private handleFunctionDeclaration;
    /**
     * Searches and returns the ImportDeclaration. If it's overridden return undefined.
     */
    private findImportDeclaration;
}
