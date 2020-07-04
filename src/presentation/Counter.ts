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

    constructor(fileName: string, importDeclaration: ImportDeclaration, sourceFile: ts.SourceFile) {
        this.fileName = fileName;
        // this.dependencyName = dependencyName;
        this.importDeclaration = importDeclaration;
        this.sourceFile = sourceFile;
    }

    get dependencyName() {
        return this.importDeclaration.getModuleSpecifier();
    }
}

export class UsageCount implements Count {

}