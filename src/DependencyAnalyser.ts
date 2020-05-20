import * as fs from "fs";
import * as path from "path";
import * as ts from "typescript";
import {DtsCreator} from "./DtsCreator";
import {ImportScanner} from "./importService";

export class DependencyAnalyser {
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
    private _importScannerMap: Map<string, ImportScanner>;

    constructor(srcPath: string) {

        if (fs.existsSync(srcPath)) {
            let lstatSync = fs.lstatSync(srcPath);

            if (lstatSync.isDirectory()) {
                this.isDirectory = true;
                this.allFiles = this.getAllFilesFlat(srcPath);
            } else if (lstatSync.isFile()) {
                this.isFile = true;
                this.allFiles = [srcPath];
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
        this.dtsCreator.createExportService();
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

    get path(): string {
        return this._path;
    }

    set path(value: string) {
        this._path = value;
    }
}