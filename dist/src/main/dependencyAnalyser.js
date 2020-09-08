"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DependencyAnalyser = void 0;
const fs = require("fs");
const path = require("path");
const ts = require("typescript");
const importService_1 = require("../importHandlers/importService");
const countService_1 = require("../presentation/countService");
/**
 * Root controller for this application.
 */
class DependencyAnalyser {
    constructor(options) {
        this.options = options;
        this.countService = new countService_1.CountService(this);
        // read package.json
        this.packageJson = JSON.parse(fs.readFileSync(path.join(options.rootDir, "package.json"), "utf-8"));
        // get all files to scan
        const allFiles = this.getAllFiles(options.scanDir);
        this.allFiles = allFiles.filesArray;
        this.filesObject = allFiles.filesObject;
    }
    get allFiles() {
        return this._allFiles;
    }
    set allFiles(value) {
        this._allFiles = value;
    }
    get filesObject() {
        return this._filesObject;
    }
    set filesObject(value) {
        this._filesObject = value;
    }
    get importScannerMap() {
        return this._importScannerMap;
    }
    set importScannerMap(value) {
        this._importScannerMap = value;
    }
    get countService() {
        return this._countService;
    }
    set countService(value) {
        this._countService = value;
    }
    get options() {
        return this._options;
    }
    set options(value) {
        this._options = value;
    }
    get packageJson() {
        return this._packageJson;
    }
    set packageJson(value) {
        this._packageJson = value;
    }
    /**
     * Scans the given given directory path and returns an object
     * with all filtered Files as array and as an object tree.
     * @param scanDir Path to a File or Directory to be scanned
     */
    getAllFiles(scanDir) {
        const options = this.options;
        const filesArray = [];
        let filesObject;
        if (fs.existsSync(scanDir)) {
            const lstatSync = fs.lstatSync(scanDir);
            if (lstatSync.isDirectory()) {
                filesObject = getAllFilesRek(scanDir);
            }
            else if (lstatSync.isFile()) {
                if (options.fileExtensionFilter.some(value => path.parse(scanDir).ext === value)) {
                    const _filesObject = {};
                    _filesObject[scanDir] = null;
                    return { "filesArray": [scanDir], "filesObject": _filesObject };
                }
                else {
                    throw new Error("The given file is not a .ts File: " + scanDir);
                }
            }
            else {
                throw new Error("Scan path is not a file nor a directory: " + scanDir);
            }
        }
        return { "filesArray": filesArray, "filesObject": filesObject };
        function getAllFilesRek(directory) {
            const directoryItems = fs.readdirSync(directory);
            const filesObj = {};
            if (options.exclude.some(value => directory.match(value)))
                return null;
            directoryItems.forEach(value => {
                const fileName = path.join(directory, value);
                const lstatSync = fs.lstatSync(fileName);
                if (lstatSync.isDirectory()) {
                    const children = getAllFilesRek(fileName);
                    filesObj[fileName] = children ? { children: children } : {};
                }
                else if (lstatSync.isFile()) {
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
    scanAllFiles() {
        this.importScannerMap = new Map();
        if (this.allFiles.length === 0) {
            throw new Error("No files to scan found.");
        }
        this.allFiles.forEach(fileName => {
            const sourceFile = ts.createSourceFile(fileName, // fileName
            fs.readFileSync(fileName, 'utf8'), // sourceText
            ts.ScriptTarget.Latest);
            const importScanner = new importService_1.ImportScanner(this, fileName, sourceFile);
            this.importScannerMap.set(fileName, importScanner);
        });
    }
    /**
     * @link OutputGenerator#generateHTML
     */
    generateOutput() {
        this.countService.outputGenerator.generateHTML();
    }
}
exports.DependencyAnalyser = DependencyAnalyser;
//# sourceMappingURL=dependencyAnalyser.js.map