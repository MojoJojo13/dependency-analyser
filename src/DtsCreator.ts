import * as ts from "typescript";
import * as path from "path";
import {ExportScanner} from "./exportService";
import {SourceFile} from "./exportDeclarations";

const options = {
    allowJs: true,
    declaration: true,
    emitDeclarationOnly: true,
}

export class DtsCreator {
    get exportSourceFileMap(): Map<string, SourceFile> {
        return this._exportSourceFileMap;
    }

    set exportSourceFileMap(value: Map<string, SourceFile>) {
        this._exportSourceFileMap = value;
    }
    /**
     * @deprecated
     */
    get exportScannerMap(): Map<string, ExportScanner> {
        return this._exportScannerMap;
    }
    /**
     * @deprecated
     */
    set exportScannerMap(value: Map<string, ExportScanner>) {
        this._exportScannerMap = value;
    }

    private _fileNames: string[];
    private _dtsFileMap: Map<string, string>;
    /**
     * @deprecated
     */
    private _exportScannerMap: Map<string, ExportScanner>;
    private _exportSourceFileMap: Map<string, SourceFile>;

    constructor(fileNames: string[]) {
        this.fileNames = fileNames;
        this.dtsFileMap = new Map();
        this.createDTS(fileNames);
    }

    createDTS(fileNames: string[]) {
        // Create a Program with an in-memory emit
        const host = ts.createCompilerHost(options);
        host.writeFile = (dirtyFileName: string, content: string) => {
            const fileName = path.normalize(dirtyFileName);
            //console.log("fileName", fileName);
            // console.log("content", content);
            this.dtsFileMap.set(fileName, content);
        }

        // Prepare and emit the d.ts files
        const program = ts.createProgram(fileNames, options, host);
        program.emit();
    }

    /**
     * @deprecated
     */
    createExportService() {
        this.exportScannerMap = new Map<string, ExportScanner>();

        this.dtsFileMap.forEach((value, key)  => {
            let exportScanner = new ExportScanner();

            const sourceFile = ts.createSourceFile(
                key,   // fileName
                value, // sourceText
                ts.ScriptTarget.Latest, // languageVersion
            );

            exportScanner.scanFile(sourceFile);

            this.exportScannerMap.set(key, exportScanner);
        })
    }

    createSourceFiles() {
        this.exportSourceFileMap = new Map<string, SourceFile>();

        this.dtsFileMap.forEach((value, key)  => {

            const srcFile = ts.createSourceFile(
                key,   // fileName
                value, // sourceText
                ts.ScriptTarget.Latest, // languageVersion
            );

            let sourceFile = new SourceFile(srcFile);

            this.exportSourceFileMap.set(key, sourceFile);
        })
    }

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
}