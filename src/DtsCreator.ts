import * as ts from "typescript";
import * as path from "path";
import {ExportScanner} from "./exportService";

const options = {
    allowJs: true,
    declaration: true,
    emitDeclarationOnly: true,
}

export class DtsCreator {
    get exportScannerMap(): Map<string, ExportScanner> {
        return this._exportScannerMap;
    }

    set exportScannerMap(value: Map<string, ExportScanner>) {
        this._exportScannerMap = value;
    }

    private _fileNames: string[];
    private _dtsFileMap: Map<string, string>;
    private _exportScannerMap: Map<string, ExportScanner>;

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