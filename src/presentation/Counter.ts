import * as ts from "typescript";
import {ImportDeclaration} from "../Declarations";

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

}