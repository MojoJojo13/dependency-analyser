"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OutputGenerator = void 0;
const pug = require("pug");
const getSizes = require("package-size");
const path = require("path");
const fs = require("fs");
const HTML_TEMPLATE_FILES = {
    "INDEX": "templates/html/index.pug",
    "MODULE": "templates/html/module.pug",
    "CODE": "templates/html/code.pug"
};
const ASSETS = [
    "assets\\uikit\\uikit.min.css",
    "assets\\uikit\\uikit.min.js",
    "assets\\uikit\\uikit-icons.min.js",
    "assets\\css\\custom.css",
    "assets\\js\\run_prettify.js"
];
class OutputGenerator {
    constructor(countService) {
        this._countService = countService;
    }
    get countService() {
        return this._countService;
    }
    set countService(value) {
        this._countService = value;
    }
    /**
     * Creates all HTML files for output.
     */
    generateHTML() {
        const dependencyFileNameMap = this._countService.groupByFileName();
        const dependencyNameMap = this._countService.groupByDependencyName();
        const scanDir = this._countService.dependencyAnalyser.options.scanDir;
        const targetDir = this._countService.dependencyAnalyser.options.targetDir;
        const allDependencies = this._countService.dependencyAnalyser.packageJson["dependencies"];
        this.date = new Date();
        this.cleanRootFolder();
        this.createAssets();
        // create index file
        new Promise(resolve => {
            resolve(this.generateIndex(dependencyNameMap, allDependencies));
        }).then(outputHTML => {
            this.createHtmlFile(path.join(targetDir, "index.html"), outputHTML);
        });
        // create module files
        dependencyNameMap.forEach((importCountArray, dependencyName) => {
            const fileName = path.join(targetDir, "modules", dependencyName) + ".html";
            const content = this.generateModules(dependencyName, importCountArray);
            this.createHtmlFile(fileName, content);
        });
        // create code files
        dependencyFileNameMap.forEach((importCountArray, filePath) => {
            let relativePath = path.relative(scanDir, filePath);
            if (relativePath.length === 0) {
                relativePath = path.parse(filePath).base;
            }
            const fileName = path.join(targetDir, "details", relativePath) + ".html";
            const usageCountArray = this._countService.groupUsageByFileName().get(filePath);
            this.createHtmlFile(fileName, this.generateFileContent(importCountArray, usageCountArray, relativePath));
        });
    }
    /**
     * Creates all missing folders of a given path on the file system.
     */
    createFolder(dirPath) {
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }
    }
    /**
     * Creates all folders to the target directory. Used to be deleting all
     * content of the folder.
     */
    cleanRootFolder() {
        const tarPath = this._countService.dependencyAnalyser.options.targetDir;
        if (!fs.existsSync(tarPath)) {
            fs.mkdirSync(tarPath);
        }
    }
    /**
     * Creates a HTML file with given content on the file system.
     */
    createHtmlFile(sPath, content) {
        this.createFolder(path.dirname(sPath));
        fs.writeFile(sPath, content, (err) => {
            if (err)
                throw err;
        });
    }
    /**
     * Copies all marked templates to the target directory on the file system.
     */
    createAssets() {
        const targetDir = this._countService.dependencyAnalyser.options.targetDir;
        ASSETS.forEach(value => {
            const source = path.join(__dirname, value);
            const destination = path.join(targetDir, "assets", path.parse(value).base);
            this.createFolder(path.join(targetDir, "assets"));
            fs.copyFileSync(source, destination);
        });
    }
    /**
     * Creates the content of the index file.
     */
    generateIndex(dependencies, allDependencies) {
        return __awaiter(this, void 0, void 0, function* () {
            // Compile the source code
            const compiledFunction = pug.compileFile(path.join(__dirname, HTML_TEMPLATE_FILES.INDEX));
            const nodeModulesPath = this._countService.dependencyAnalyser.options.nodeModulesDir;
            const dependencyData = [];
            const nodeModulesData = [];
            const chartData = [{
                    elementId: "dependenciesChart",
                    title: "Dependency Imports",
                    data: []
                }, {
                    elementId: "nodeModulesChart",
                    title: "Minified Size of Dependency in kB",
                    data: []
                }, {
                    elementId: "customModulesChart",
                    title: "Custom Module Imports",
                    data: []
                }];
            // separate dependency modules from NodeJs modules
            dependencies.forEach((value, key) => {
                if (value[0].isNodeModule) {
                    nodeModulesData.push({
                        name: key,
                        count: value.length,
                    });
                }
                else {
                    dependencyData.push({ name: key, count: value.length });
                }
            });
            // calculate sizes of  dependencies
            const promisesArray = [];
            dependencyData.forEach(value => {
                // prepare chart data for [dependency -> imports in files]
                chartData[0].data.push([value.name, value.count]);
                promisesArray.push(getSizes(value.name, {
                    resolve: [nodeModulesPath]
                }).then(data => {
                    /* data = {
                          name: 'react,react-dom',
                          size: 12023, // in bytes
                          minified: 2342,
                          gzipped: 534,
                          versionedName: 'react@16.0.0,react-dom@16.0.0'
                        } */
                    data["sizeOnDisk"] = convertToKb(getSizeOnDiskRek(path.join(nodeModulesPath, data.name)));
                    data["sizeInKB"] = convertToKb(data.size);
                    data["minifiedInKB"] = convertToKb(data.minified);
                    data["gzippedInKB"] = convertToKb(data.gzipped);
                    value["sizeInfo"] = data;
                    chartData[1].data.push([value.name, parseFloat(data["minifiedInKB"])]);
                    chartData[2].data.push([value.name, parseFloat(data["minifiedInKB"]) / value.count]);
                }).catch(err => {
                    // value["sizeInfo"] = {
                    //     sizeOnDisk: convertToKb(getSizeOnDiskRek(path.join(nodeModulesPath, value.name)))
                    // }
                    // console.error(err);
                }));
            });
            // add all not used dependencies from the package.json
            Object.keys(allDependencies).forEach(dependencyName => {
                if (!dependencyData.some(value => value.name === dependencyName)) {
                    dependencyData.push({
                        name: dependencyName,
                        count: 0,
                    });
                }
            });
            // sort
            dependencyData.sort((a, b) => b.count - a.count);
            nodeModulesData.sort((a, b) => b.count - a.count);
            yield Promise.all(promisesArray);
            // add missing size info
            dependencyData.forEach(dependency => {
                if (!dependency.sizeInfo) {
                    dependency.sizeInfo = {
                        sizeOnDisk: convertToKb(getSizeOnDiskRek(path.join(nodeModulesPath, dependency.name))),
                        sizeInKB: 0,
                        minifiedInKB: 0,
                        gzippedInKB: 0,
                        sizeInfo: 0
                    };
                }
            });
            chartData[1].data.sort(((a, b) => b[1] - a[1]));
            chartData[2].data.sort(((a, b) => b[1] - a[1]));
            chartData.forEach(value => {
                value.data.unshift(["", ""]);
            });
            // render a set of data
            return compiledFunction({
                title: 'Overview',
                folder: './',
                chartData: chartData,
                dependencies: dependencyData,
                nodeModules: nodeModulesData,
                date: this.date
            });
            /**
             * Converts the given size as bytes to kilobytes and formats for presentation.
             */
            function convertToKb(x) {
                return (x / 1024).toLocaleString("en-US", {
                    minimumFractionDigits: 1,
                    maximumFractionDigits: 1
                });
            }
            /**
             * Recursively loops throw the given directory and returns ins size in bytes.
             */
            function getSizeOnDiskRek(dirPath) {
                let size = 0;
                const itemStats = fs.lstatSync(dirPath);
                if (itemStats.isDirectory()) {
                    const allSubs = fs.readdirSync(dirPath);
                    {
                        allSubs.forEach(sub => {
                            size += getSizeOnDiskRek(path.join(dirPath, sub));
                        });
                    }
                }
                else {
                    size = itemStats.size;
                }
                return size;
            }
        });
    }
    /**
     * Creates the content of the modules files.
     */
    generateModules(dependencyName, importCountArray) {
        const compiledFunction = pug.compileFile(path.join(__dirname, HTML_TEMPLATE_FILES.MODULE));
        const slashCount = (dependencyName.match(/\//g) || []).length;
        const files = this._countService.dependencyAnalyser.filesObject;
        // Prepare Data
        const convertedData = fillUpData(files, "details");
        // Render a set of data
        return compiledFunction({
            title: 'Module: ' + dependencyName,
            moduleName: dependencyName,
            folder: '../'.repeat(slashCount + 1),
            filesTree: convertedData,
            date: this.date
        });
        /**
         * Recursively transforms the data for presentation of files.
         */
        function fillUpData(filesObject, combinedPath) {
            const dataObj = {};
            Object.keys(filesObject).forEach((key) => {
                const shortName = path.parse(key).base;
                dataObj[shortName] = {};
                if (filesObject[key] && filesObject[key].children) {
                    dataObj[shortName].children = fillUpData(filesObject[key].children, path.join(combinedPath, shortName));
                }
                const usedImport = importCountArray.find(element => element.fileName === key);
                if (usedImport) {
                    dataObj[shortName].adds = {
                        "link": path.join("../".repeat(slashCount + 1), combinedPath, shortName) + ".html?module="
                            + dependencyName + "&imports=" + usedImport.importDeclaration.getImportSpecifiers().join(","),
                        "imports": usedImport.importDeclaration.isEntireModuleImported() ?
                            ["*"] : usedImport.importDeclaration.getImportSpecifiers()
                    };
                }
            });
            return dataObj;
        }
    }
    /**
     * Creates the content of the code files.
     */
    generateFileContent(importCounts, usageCountArray, shortFileName) {
        const compiledFunction = pug.compileFile(path.join(__dirname, HTML_TEMPLATE_FILES.CODE));
        const formattedContent = importCounts[0].sourceFile.text;
        const lineCount = (formattedContent.match(/\n/g) || []).length;
        const slashCount = (shortFileName.match(/\\/g) || []).length;
        const importsArray = [];
        const usageArray = [];
        const countMap = new Map();
        const tempCountArr = [];
        const countArray = [[""], [""]];
        // prepare data to mark imports
        importCounts.forEach(importCount => {
            importsArray.push({
                moduleSpecifier: importCount.importDeclaration.getModuleSpecifier(),
                importSpecifiers: importCount.importDeclaration.getImportSpecifiers(),
                isEntireModuleImported: importCount.importDeclaration.isEntireModuleImported(),
                lineCount: getLineCountToOccurrence(importCount.importDeclaration.node.end)
            });
        });
        // prepare data to mark imported stuff, when used
        if (!usageCountArray)
            usageCountArray = [];
        usageCountArray.forEach(value => {
            const identifier = value.identifier;
            const identifierName = identifier.escapedText.toString();
            usageArray.push({
                lineCount: getLineCountToOccurrence(identifier.end),
                identifierName: identifierName,
                dependencyName: value.dependencyName
            });
            // Count the usages for the chart
            countMap.set(identifierName, countMap.get(identifierName) >= 0 ? countMap.get(identifierName) + 1 : 1);
        });
        countMap.forEach((value, key) => {
            tempCountArr.push([key, value]);
        });
        tempCountArr.sort((a, b) => b[1] - a[1]);
        tempCountArr.forEach(value => {
            countArray[0].push(value[0]);
            // @ts-ignore
            countArray[0].push({ role: 'annotation' });
            countArray[1].push(value[1]);
            countArray[1].push(value[1].toString());
        });
        return compiledFunction({
            title: 'File: ' + shortFileName,
            shortFileName: shortFileName,
            folder: '../'.repeat(slashCount + 1),
            sourceCode: formattedContent,
            lineCount: lineCount + 1,
            importsArray: importsArray,
            usageArray: usageArray,
            countArray: countArray,
            date: this.date
        });
        /**
         * Counts the lines to the occurrence of the searched node.
         */
        function getLineCountToOccurrence(endPosition) {
            const code = formattedContent.substring(0, endPosition);
            return (code.match(/\n/g) || []).length + 1;
        }
    }
}
exports.OutputGenerator = OutputGenerator;
//# sourceMappingURL=outputGenerator.js.map