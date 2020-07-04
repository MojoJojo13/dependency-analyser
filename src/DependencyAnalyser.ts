import * as fs from "fs";
import * as path from "path";
import * as ts from "typescript";
import {DtsCreator} from "./DtsCreator";
import {ImportScanner} from "./importService";
import {ExportScanner} from "./exportService";
import {SourceFile} from "./exportDeclarations";
import {CountService} from "./presentation/CountService";

export class DependencyAnalyser {
    get countService(): CountService {
        return this._countService;
    }

    set countService(value: CountService) {
        this._countService = value;
    }

    get moduleSourceFileMap(): Map<string, SourceFile> {
        return this._moduleSourceFileMap;
    }

    set moduleSourceFileMap(value: Map<string, SourceFile>) {
        this._moduleSourceFileMap = value;
    }

    get moduleExportScannerMap(): Map<string, ExportScanner> {
        return this._moduleExportScannerMap;
    }

    set moduleExportScannerMap(value: Map<string, ExportScanner>) {
        this._moduleExportScannerMap = value;
    }

    get importScannerMap(): Map<string, ImportScanner> {
        return this._importScannerMap;
    }

    set importScannerMap(value: Map<string, ImportScanner>) {
        this._importScannerMap = value;
    }

    get allFiles(): string[] {
        return this._allFiles;
    }

    set allFiles(value: string[]) {
        this._allFiles = value;
    }

    get isFile(): boolean {
        return this._isFile;
    }

    set isFile(value: boolean) {
        this._isFile = value;
    }

    get isDirectory(): boolean {
        return this._isDirectory;
    }

    set isDirectory(value: boolean) {
        this._isDirectory = value;
    }

    get dtsCreator(): DtsCreator {
        return this._dtsCreator;
    }

    set dtsCreator(value: DtsCreator) {
        this._dtsCreator = value;
    }

    private _path: string;
    private _isDirectory: boolean;
    private _isFile: boolean;
    private _dtsCreator: DtsCreator;
    private _allFiles: string[];
    filesTree: Map<string, object>;
    private _importScannerMap: Map<string, ImportScanner>;
    private _moduleExportScannerMap: Map<string, ExportScanner>;
    private _moduleSourceFileMap: Map<string, SourceFile>;
    private _countService: CountService;

    constructor(srcPath: string) {
        this.moduleExportScannerMap = new Map<string, ExportScanner>();
        this.moduleSourceFileMap = new Map<string, SourceFile>();
        this._countService = new CountService(this);

        if (fs.existsSync(srcPath)) {
            let lstatSync = fs.lstatSync(srcPath);

            if (lstatSync.isDirectory()) {

                this.isDirectory = true;
                this.allFiles = this.getAllFilesFlat(srcPath);
                this.filesTree = this.getAllFilesAsTree(srcPath);

            } else if (lstatSync.isFile()) {

                // handle only Typescript Files
                if (path.extname(srcPath) === "ts") {
                    this.isFile = true;
                    this.allFiles = [srcPath];
                }

            } else {
                throw "not a file or a folder: " + srcPath;
            }
        } else {
            throw "not a valid srcPath: " + srcPath;
        }
    }

    initDtsCreator() {
        console.log("this.allFiles", this.allFiles);
        this.dtsCreator = new DtsCreator(this.allFiles);
        // this.dtsCreator.createExportService();
        this.dtsCreator.createSourceFiles();
    }

    scanAllFiles() {
        this.importScannerMap = new Map<string, ImportScanner>();

        this.allFiles.forEach(fileName => {
            const sourceFile = ts.createSourceFile(
                fileName, // fileName
                fs.readFileSync(fileName, 'utf8'), // sourceText
                ts.ScriptTarget.Latest, // languageVersion
            );

            let importScanner = new ImportScanner(this, fileName, sourceFile);
            this.importScannerMap.set(fileName, importScanner);
        })
    }

    getAllFilesFlat(directory: string): string[] { //TODO: should be async maybe
        let filesArray: string[] = [];

        getAllFilesFlatRek(directory);

        return filesArray;

        function getAllFilesFlatRek(directory: string) {
            let directoryItems = fs.readdirSync(directory);

            directoryItems.forEach(value => {
                const fileName = path.join(directory, value);
                let lstatSync = fs.lstatSync(fileName);

                if (lstatSync.isDirectory()) {
                    getAllFilesFlatRek(fileName);
                } else if (lstatSync.isFile()) {
                    filesArray.push(fileName);
                } else {
                    console.log("ERROR: not a File of Folder");
                }
            })
        }
    }

    getAllFilesAsTree(directory: string) {
        return getAllFilesAsTreeRek(directory);

        function getAllFilesAsTreeRek(directory: string) {
            let directoryItems = fs.readdirSync(directory);
            let filesArray = new Map<string, object>();

            directoryItems.forEach(value => {
                const fileName = path.join(directory, value);
                let lstatSync = fs.lstatSync(fileName);

                if (lstatSync.isDirectory()) {
                    filesArray.set(fileName, getAllFilesAsTreeRek(fileName));
                } else if (lstatSync.isFile()) {
                    filesArray.set(fileName, null);
                } else {
                    console.log("ERROR: not a File of Folder");
                }
            });

            return filesArray;
        }
    }

    getModuleSourceFile(moduleName: string): SourceFile {
        let sourceFile: SourceFile = this.moduleSourceFileMap.get(moduleName);

        if (!sourceFile) {
            let pathToModule = require.resolve(moduleName);
            let dtsPath = pathToModule.replace(/\.js$/g, ".d.ts");

            console.log("pathToModule", pathToModule);
            if (fs.existsSync(dtsPath)) {

                const sourceFileTs = ts.createSourceFile(
                    dtsPath, // fileName
                    fs.readFileSync(dtsPath, 'utf8'), // sourceText
                    ts.ScriptTarget.Latest, // languageVersion
                );

                sourceFile = new SourceFile(sourceFileTs);
                this.moduleSourceFileMap.set(moduleName, sourceFile);
            } else {
                console.error("moduleName", moduleName);
                console.error("pathToModule", pathToModule);
                //TODO: handle standard modules
                return;
                // throw Error("can't find .d.ts file");
            }
        }

        console.log("-------------------");

        return sourceFile;
    }

    /**
     * @deprecated
     */
    getModuleExportScanner(moduleName: string): ExportScanner {
        let exportScanner = this.moduleExportScannerMap.get(moduleName);

        if (!exportScanner) {

            let pathToModule = require.resolve(moduleName);
            let dtsPath = pathToModule.replace(".js$", ".d.ts");

            console.log("pathToModule", pathToModule);
            if (fs.existsSync(dtsPath)) {

                const sourceFile = ts.createSourceFile(
                    dtsPath, // fileName
                    fs.readFileSync(dtsPath, 'utf8'), // sourceText
                    ts.ScriptTarget.Latest, // languageVersion
                );

                exportScanner = new ExportScanner();
                exportScanner.scanFile(sourceFile);

                this.moduleExportScannerMap.set(moduleName, exportScanner);
            } else {
                console.error("moduleName", moduleName);
                console.error("pathToModule", pathToModule);
                //TODO: handle standard modules
                return;
                // throw Error("can't find .d.ts file");
            }
        }

        return exportScanner;
    }

    get path(): string {
        return this._path;
    }

    set path(value: string) {
        this._path = value;
    }
}