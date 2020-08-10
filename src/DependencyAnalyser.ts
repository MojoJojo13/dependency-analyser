import * as fs from "fs";
import * as path from "path";
import * as ts from "typescript";
import {DtsCreator} from "./DtsCreator";
import {ImportScanner} from "./importService";
import {ExportScanner} from "./exportService";
import {SourceFile} from "./exportDeclarations";
import {CountService} from "./presentation/CountService";
import {Options} from "./index";

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

    // get isFile(): boolean {
    //     return this._isFile;
    // }
    //
    // set isFile(value: boolean) {
    //     this._isFile = value;
    // }
    //
    // get isDirectory(): boolean {
    //     return this._isDirectory;
    // }
    //
    // set isDirectory(value: boolean) {
    //     this._isDirectory = value;
    // }

    get dtsCreator(): DtsCreator {
        return this._dtsCreator;
    }

    set dtsCreator(value: DtsCreator) {
        this._dtsCreator = value;
    }

    private _path: string;
    // private _isDirectory: boolean;
    // private _isFile: boolean;
    private _dtsCreator: DtsCreator;
    private _allFiles: string[];
    // filesTree: Map<string, object>;
    filesObject: object;
    private _importScannerMap: Map<string, ImportScanner>;
    // private _moduleExportScannerMap: Map<string, ExportScanner>;
    private _moduleSourceFileMap: Map<string, SourceFile>;
    private _countService: CountService;
    options: Options;
    packageJson: object;

    constructor(options: Options) {
        this.options = options;
        // this.moduleExportScannerMap = new Map<string, ExportScanner>();
        this.moduleSourceFileMap = new Map<string, SourceFile>();
        this._countService = new CountService(this);

        // read package.json
        this.packageJson = JSON.parse(fs.readFileSync(path.join(options.rootDir, "package.json"), "utf-8"));

        const scanDir = options.scanDir;

        if (fs.existsSync(scanDir)) {
            let lstatSync = fs.lstatSync(scanDir);

            if (lstatSync.isDirectory()) {

                // this.isDirectory = true;
                // this.allFiles = this.getAllFilesFlat(scanDir);
                // this.filesTree = this.getAllFilesAsTree(scanDir);

                const allFiles = this.getAllFiles(scanDir);
                // console.log("getAllFiles", allFiles);
                this.allFiles = allFiles.filesArray;
                this.filesObject = allFiles.filesObject;


            } else if (lstatSync.isFile()) {

                // handle only Typescript Files
                if (path.extname(scanDir) === ".ts") {
                    // this.isFile = true;
                    this.allFiles = [scanDir];
                }

            } else {
                throw "not a file or a folder: " + scanDir;
            }
        } else {
            throw "not a valid srcPath: " + scanDir;
        }
    }

    getAllFiles(rootDirectory: string) {
        let options = this.options;
        let filesArray: string[] = [];

        let filesObject = getAllFilesRek(rootDirectory);

        return {"filesArray": filesArray, "filesObject": filesObject};

        function getAllFilesRek(directory: string): object {
            const directoryItems = fs.readdirSync(directory);
            const filesObj = {};

            if (options.exclude.some(value => directory.match(value))) return null;

            directoryItems.forEach(value => {
                const fileName = path.join(directory, value);
                const lstatSync = fs.lstatSync(fileName);

                if (lstatSync.isDirectory()) {
                    const children = getAllFilesRek(fileName);
                    filesObj[fileName] = children ? {children: children} : {};
                } else if (lstatSync.isFile()) {
                    if (options.fileExtensionFilter.some(value => path.parse(fileName).ext === value)) {
                        filesObj[fileName] = null;
                        filesArray.push(fileName);
                    }
                } else {
                    console.log("ERROR: not a File nor a Folder");
                }
            });

            return filesObj;
        }
    }

    scanAllFiles() {
        this.importScannerMap = new Map<string, ImportScanner>();

        if (this.allFiles.length === 0) {
            throw Error("No files to scan found!");
        }

        this.allFiles.forEach(fileName => {
            const sourceFile = ts.createSourceFile(
                fileName, // fileName
                fs.readFileSync(fileName, 'utf8'), // sourceText
                ts.ScriptTarget.Latest, // languageVersion
            );

            let importScanner = new ImportScanner(this, fileName, sourceFile);
            this.importScannerMap.set(fileName, importScanner);
        });
    }

    generateOutput() {
        this.countService.outputGenerator.generateHTML();
    }

    // getAllFilesFlat(directory: string): string[] {
    //     let filesArray: string[] = [];
    //     let options = this.options;
    //
    //     getAllFilesFlatRek(directory);
    //
    //     return filesArray;
    //
    //     function getAllFilesFlatRek(directory: string): void {
    //         let directoryItems = fs.readdirSync(directory);
    //
    //         if (options.exclude.some(value => {
    //             let regEx = new RegExp(path.normalize(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    //             return directory.match(regEx);
    //         })) {
    //             return;
    //         }
    //
    //         directoryItems.forEach(value => {
    //             const fileName = path.join(directory, value);
    //             let lstatSync = fs.lstatSync(fileName);
    //
    //             if (lstatSync.isDirectory()) {
    //                 getAllFilesFlatRek(fileName);
    //             } else if (lstatSync.isFile()) {
    //                 filesArray.push(fileName);
    //             } else {
    //                 console.log("ERROR: not a File nor a Folder");
    //             }
    //         })
    //     }
    // }

    // getAllFilesAsTree(directory: string) {
    //     return getAllFilesAsTreeRek(directory);
    //
    //     function getAllFilesAsTreeRek(directory: string) {
    //         let directoryItems = fs.readdirSync(directory);
    //         let filesArray = new Map<string, object>();
    //
    //         directoryItems.forEach(value => {
    //             const fileName = path.join(directory, value);
    //             let lstatSync = fs.lstatSync(fileName);
    //
    //             if (lstatSync.isDirectory()) {
    //                 filesArray.set(fileName, getAllFilesAsTreeRek(fileName));
    //             } else if (lstatSync.isFile()) {
    //                 filesArray.set(fileName, null);
    //             } else {
    //                 console.log("ERROR: not a File nor a Folder");
    //             }
    //         });
    //
    //         return filesArray;
    //     }
    // }

    getModuleSourceFile(moduleName: string): SourceFile {
        let sourceFile: SourceFile = this.moduleSourceFileMap.get(moduleName);

        if (!sourceFile) {
            let pathToModule = require.resolve(moduleName, {paths: [this.options.nodeModulesDir]});
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

    initDtsCreator() {
        // console.log("this.allFiles", this.allFiles);
        this.dtsCreator = new DtsCreator(this.allFiles);
        // this.dtsCreator.createExportService();
        this.dtsCreator.createSourceFiles();
    }

    // /**
    //  * @deprecated
    //  */
    // getModuleExportScanner(moduleName: string): ExportScanner {
    //     let exportScanner = this.moduleExportScannerMap.get(moduleName);
    //
    //     if (!exportScanner) {
    //
    //         let pathToModule = require.resolve(moduleName);
    //         let dtsPath = pathToModule.replace(".js$", ".d.ts");
    //
    //         // console.log("pathToModule", pathToModule);
    //         if (fs.existsSync(dtsPath)) {
    //
    //             const sourceFile = ts.createSourceFile(
    //                 dtsPath, // fileName
    //                 fs.readFileSync(dtsPath, 'utf8'), // sourceText
    //                 ts.ScriptTarget.Latest, // languageVersion
    //             );
    //
    //             exportScanner = new ExportScanner();
    //             exportScanner.scanFile(sourceFile);
    //
    //             this.moduleExportScannerMap.set(moduleName, exportScanner);
    //         } else {
    //             console.error("moduleName", moduleName);
    //             console.error("pathToModule", pathToModule);
    //             //TODO: handle standard modules
    //             return;
    //             // throw Error("can't find .d.ts file");
    //         }
    //     }
    //
    //     return exportScanner;
    // }

    get path(): string {
        return this._path;
    }

    set path(value: string) {
        this._path = value;
    }
}