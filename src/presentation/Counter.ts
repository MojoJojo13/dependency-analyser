import * as ts from "typescript";
import {Declaration, ImportDeclaration} from "../Declarations";

enum ImportKind {
    Test
}

interface Count {

}

export class ImportCount implements Count {
    fileName: string;
    // dependencyName: string;
    importDeclaration: ImportDeclaration;
    sourceFile: ts.SourceFile;
    isNodeModule: boolean;
    isCustomImport: boolean;

    constructor(fileName: string, importDeclaration: ImportDeclaration, sourceFile: ts.SourceFile, isNodeModule: boolean, isCustomImport: boolean) {
        this.fileName = fileName;
        // this.dependencyName = dependencyName;
        this.importDeclaration = importDeclaration;
        this.sourceFile = sourceFile;
        this.isNodeModule = isNodeModule;
        this.isCustomImport = isCustomImport;
    }

    get dependencyName() {
        return this.importDeclaration.getModuleSpecifier();
    }
}

export class UsageCount implements Count {
    fileName: string;
    importDeclaration: Declaration;
    identifier: ts.Identifier;

    constructor(fileName: string, importDeclaration: Declaration, identifier: ts.Identifier) {
        this.fileName = fileName;
        this.importDeclaration = importDeclaration;
        this.identifier = identifier;
    }

    get dependencyName(): string {
        return (<ImportDeclaration>this.importDeclaration).getModuleSpecifier();
    }
}