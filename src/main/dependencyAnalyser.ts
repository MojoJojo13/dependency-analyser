import * as fs from "fs";
import * as path from "path";
import * as ts from "typescript";
import {ImportScanner} from "../importHandlers/importService";
import {CountService} from "../presentation/countService";
import {Options} from "../index";

/**
 * Root controller for this application.
 */
export class DependencyAnalyser {

    get allFiles(): string[] {
        return this._allFiles;
    }

    set allFiles(value: string[]) {
        this._allFiles = value;
    }

    get filesObject(): object {
        return this._filesObject;
    }

    set filesObject(value: object) {
        this._filesObject = value;
    }

    get importScannerMap(): Map<string, ImportScanner> {
        return this._importScannerMap;
    }

    set importScannerMap(value: Map<string, ImportScanner>) {
        this._importScannerMap = value;
    }

    get countService(): CountService {
        return this._countService;
    }

    set countService(value: CountService) {
        this._countService = value;
    }

    get options(): Options {
        return this._options;
    }

    set options(value: Options) {
        this._options = value;
    }

    get packageJson(): object {
        return this._packageJson;
    }

    set packageJson(value: object) {
        this._packageJson = value;
    }

    private _allFiles: string[];
    private _filesObject: object;
    private _importScannerMap: Map<string, ImportScanner>;
    private _countService: CountService;
    private _options: Options;
    private _packageJson: object;

    constructor(options: Options) {
        this.options = options;
        this.countService = new CountService(this);

        // read package.json
        this.packageJson = JSON.parse(fs.readFileSync(path.join(options.rootDir, "package.json"), "utf-8"));

        // get all files to scan
        const allFiles = this.getAllFiles(options.scanDir);
        this.allFiles = allFiles.filesArray;
        this.filesObject = allFiles.filesObject;
    }

    /**
     * Scans the given given directory path and returns an object
     * with all filtered Files as array and as an object tree.
     * @param scanDir Path to a File or Directory to be scanned
     */
    getAllFiles(scanDir: string): { filesArray, filesObject } {
        const options = this.options;
        const filesArray: string[] = [];
        let filesObject;

        if (fs.existsSync(scanDir)) {
            const lstatSync = fs.lstatSync(scanDir);

            if (lstatSync.isDirectory()) {

                filesObject = getAllFilesRek(scanDir);

            } else if (lstatSync.isFile()) {

                if (options.fileExtensionFilter.some(value => path.parse(scanDir).ext === value)) {
                    const _filesObject = {};
                    _filesObject[scanDir] = null;
                    return {"filesArray": [scanDir], "filesObject": _filesObject};
                } else {
                    throw new Error("The given file is not a .ts File: " + scanDir);
                }

            } else {
                throw new Error("Scan path is not a file nor a directory: " + scanDir);
            }
        }

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
                    if (options.fileExtensionFilter.some(fileExtension => path.parse(fileName).ext === fileExtension)) {
                        filesObj[fileName] = null;
                        filesArray.push(fileName);
                    }
                }
            });

            return filesObj;
        }
    }

    /**
     * Scans all found files with ImportScanner
     */
    scanAllFiles(): void {
        this.importScannerMap = new Map<string, ImportScanner>();

        if (this.allFiles.length === 0) {
            throw new Error("No files to scan found.");
        }

        this.allFiles.forEach(fileName => {
            const sourceFile = ts.createSourceFile(
                fileName, // fileName
                fs.readFileSync(fileName, 'utf8'), // sourceText
                ts.ScriptTarget.Latest, // languageVersion
            );

            const importScanner = new ImportScanner(this, fileName, sourceFile);
            this.importScannerMap.set(fileName, importScanner);
        });
    }

    /**
     * @link OutputGenerator#generateHTML
     */
    generateOutput(): void {
        this.countService.outputGenerator.generateHTML();
    }

}