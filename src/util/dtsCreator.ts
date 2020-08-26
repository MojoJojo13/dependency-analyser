import * as ts from "typescript";
import * as path from "path";
import {SourceFile} from "../exportHandlers/exportDeclarations";

const options = {
    allowJs: true,
    declaration: true,
    emitDeclarationOnly: true,
}

/**
 * @deprecated
 */
export class DtsCreator {

    get fileNames(): string[] {
        return this._fileNames;
    }

    set fileNames(value: string[]) {
        this._fileNames = value;
    }

    get dtsFileMap(): Map<string, string> {
        return this._dtsFileMap;
    }

    set dtsFileMap(value: Map<string, string>) {
        this._dtsFileMap = value;
    }

    get exportSourceFileMap(): Map<string, SourceFile> {
        return this._exportSourceFileMap;
    }

    set exportSourceFileMap(value: Map<string, SourceFile>) {
        this._exportSourceFileMap = value;
    }

    private _fileNames: string[];
    private _dtsFileMap: Map<string, string>;
    private _exportSourceFileMap: Map<string, SourceFile>;

    constructor(fileNames: string[]) {
        this.fileNames = fileNames;
        this.dtsFileMap = new Map();
        this.createDTS(fileNames);
    }

    /**
     * @deprecated
     */
    createDTS(fileNames: string[]) {
        // Create a Program with an in-memory emit
        const host = ts.createCompilerHost(options);
        host.writeFile = (dirtyFileName: string, content: string) => {
            const fileName = path.normalize(dirtyFileName);
            this.dtsFileMap.set(fileName, content);
        }

        // Prepare and emit the d.ts files
        const program = ts.createProgram(fileNames, options, host);
        program.emit();
    }

    /**
     * @deprecated
     */
    createSourceFiles() {
        this.exportSourceFileMap = new Map<string, SourceFile>();

        this.dtsFileMap.forEach((sourceText, fileName)  => {

            const srcFile = ts.createSourceFile(
                fileName,
                sourceText,
                ts.ScriptTarget.Latest, // languageVersion
            );

            let sourceFile = new SourceFile(srcFile);

            this.exportSourceFileMap.set(fileName, sourceFile);
        })
    }

}