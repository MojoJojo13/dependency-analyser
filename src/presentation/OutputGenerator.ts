import {CountService} from "./CountService";
import * as fs from "fs";
import * as path from "path";
import {ImportCount} from "./Counter";
import * as pug from "pug";

const getSizes = require('package-size');

const HTML_TEMPLATE_FILES = {
    "INDEX": "templates/html/index.pug",
    "MODULE": "templates/html/module.pug",
    "CODE": "templates/html/code.pug"
};

const COMPLEMENT_FILES = [
    "templates\\uikit\\uikit.min.css",
    "templates\\uikit\\uikit.min.js",
    "templates\\uikit\\uikit-icons.min.js",
    "templates\\css\\custom.css",
    "templates\\js\\custom.js",
    "templates\\js\\run_prettify.js"
];

export class OutputGenerator {

    static generateHTML(countService: CountService, sPath: string, rootPath: string, filesTree: Map<string, object>) {
        const date: Date = new Date();
        const dependencyFileNameMap = countService.groupByFileName();
        const dependencyNameMap = countService.groupByDependencyName();

        this.cleanRootFolder(rootPath);
        this.createComplements(rootPath);

        // INDEX
        new Promise<any>(resolve => {
            resolve(this.generateIndex(dependencyNameMap, date));
        }).then(outputHTML => {
            this.createHtmlFile(path.join(rootPath, "index.html"), outputHTML);
        });

        // MODULES
        dependencyNameMap.forEach((importCountArray, dependencyName) => {
            const fileName = path.join(rootPath, "modules", dependencyName) + ".html";
            const content = this.generateModules(dependencyName, importCountArray, filesTree, date);

            this.createHtmlFile(fileName, content);
        });

        // FILES
        dependencyFileNameMap.forEach((importCountArray, key) => {
            const shortFileName = key.replace(sPath, "");
            const fileName = path.join(rootPath, "details", shortFileName) + ".html";

            this.createHtmlFile(fileName, this.generateFileContent(importCountArray, shortFileName, date));
        });

    }

    // static getHtmlFilePath(sPath: string) {
    //     // const htmlFileName = sPath.replace("\.ts", ".html");
    //     return path.join("details", sPath);
    // }

    static createFolder(dirPath: string) {
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, {recursive: true});
        }
    }

    static cleanRootFolder(rootPath: string) {
        if (!fs.existsSync(rootPath)) {
            fs.mkdirSync(rootPath);
        } else {
            fs.rmdirSync(rootPath, {recursive: true});
            fs.mkdirSync(rootPath);
        }
    }

    static createHtmlFile(sPath: string, content: string) {
        this.createFolder(path.dirname(sPath));
        fs.writeFileSync(sPath, content);
    }

    static createComplements(sPath: string): void {

        COMPLEMENT_FILES.forEach(value => {
            const source = path.join(__dirname, value);
            const destination = path.join(sPath, path.parse(value).base);

            fs.copyFileSync(source, destination);
        });
    }

    static async generateIndex(dependencies: Map<string, ImportCount[]>, date: Date) {
        // Compile the source code
        const compiledFunction = pug.compileFile(path.join(__dirname, HTML_TEMPLATE_FILES.INDEX));
        const dependencyData = [];
        const nodeModulesData = [];
        // const customModulesData = [];
        const chartData = [{
            elementId: "dependenciesChart",
            title: "Dependency Imports",
            data: [["", ""]]
        }, {
            elementId: "nodeModulesChart",
            title: "Node Module Imports",
            data: [["", ""]]
        }, {
            elementId: "customModulesChart",
            title: "Custom Module Imports",
            data: [["", ""]]
        }];

        // Prepare data
        dependencies.forEach((value, key) => {
            if (value[0].isNodeModule) {
                nodeModulesData.push({name: key, count: value.length});
            } else {
                // if (value[0].isCustomImport) {
                //     customModulesData.push({name: key, count: value.length});
                // } else {
                //
                // }
                dependencyData.push({name: key, count: value.length});
            }
        });

        dependencyData.sort((a, b) => {
            return b.count - a.count;
        });

        nodeModulesData.sort((a, b) => {
            return b.count - a.count;
        });

        // customModulesData.sort((a, b) => {
        //     return b.count - a.count;
        // });

        let promisesArray = [];
        dependencyData.forEach(value => {
            chartData[0].data.push([value.name, value.count]);

            const nodeModulesPath = "C:\\Users\\Paul\\Documents\\Git\\Uni Projects\\code-server\\node_modules";  // FixMe

            // Calculate sizes of modules
            promisesArray.push(
                getSizes(value.name, {
                    resolve: [nodeModulesPath]
                }).then(data => {
                    // data = {
                    //       name: 'react,react-dom',
                    //       size: 12023, // in bytes
                    //       minified: 2342,
                    //       gzipped: 534,
                    //       versionedName: 'react@16.0.0,react-dom@16.0.0'
                    //     }

                    data["sizeOnDisk"] = convertToKb(getSizeOnDiskRek(path.join(nodeModulesPath, data.name)));
                    data["sizeInKB"] = convertToKb(data.size);
                    data["minifiedInKB"] = convertToKb(data.minified);
                    data["gzippedInKB"] = convertToKb(data.gzipped);
                    value["sizeInfo"] = data;

                    function convertToKb(x: number) {
                        let xInKb = x / 1024; //TODO: maybe 1024? check it
                        // return xInKb > 0 ? Math.round(xInKb) : xInKb;
                        return xInKb > 0 ? (x / 1024).toFixed(1) : xInKb;
                    }

                    function getSizeOnDiskRek(dirPath: string) {
                        let size = 0;
                        let itemStats = fs.lstatSync(dirPath);
                        if (itemStats.isDirectory()) {
                            let allSubs = fs.readdirSync(dirPath); {
                                allSubs.forEach(sub => {
                                    size += getSizeOnDiskRek(path.join(dirPath, sub));
                                });
                            }
                        } else {
                            size = itemStats.size;
                        }

                        return size;
                    }
                })
            );
        });

        nodeModulesData.forEach(value => {
            chartData[1].data.push([value.name, value.count]);
        });

        // customModulesData.forEach(value => {
        //     chartData[2].data.push([value.name, value.count]);
        // });

        await Promise.all(promisesArray);

        // Render a set of data
        return compiledFunction({
            title: 'Overview',
            folder: './',
            chartData: chartData,
            dependencies: dependencyData,
            nodeModules: nodeModulesData,
            // customModules: customModulesData,
            date: date
        });
    }

    static generateModules(dependencyName: string, importCountArray: ImportCount[], filesTree: Map<string, object>, date: Date): any {
        // Compile the source code
        // console.log("__dirname", __dirname);
        const compiledFunction = pug.compileFile(path.join(__dirname, HTML_TEMPLATE_FILES.MODULE));
        const slashCount = (dependencyName.match(/\//g) || []).length;
        // Prepare Data
        const convertedData = transformDataRek(filesTree, "dependency-analysis/details");
        // Render a set of data
        return compiledFunction({
            title: 'Module: ' + dependencyName,
            moduleName: dependencyName,
            folder: '../'.repeat(slashCount + 1),
            filesTree: convertedData,
            date: date
        });

        // Transforms the files tree map to an object with all necessary info for the frontend
        function transformDataRek(filesTree: Map<string, object>, combinedPath: string) {
            let dataObj = {};
            // let foundAtLeastOneEntry = false;

            filesTree.forEach((value, key) => {
                const extension = path.parse(key).ext;
                if (extension && extension !== ".ts") return; // remove non .ts files

                const shortName = path.parse(key).base;
                dataObj[shortName] = {};

                if (value) { // check if it's a folder
                    // foundAtLeastOneEntry = true;
                    let subfolders = transformDataRek(<Map<string, object>>value, path.join(combinedPath, shortName));
                    if (Object.keys(subfolders).length) { // folder not empty
                        dataObj[shortName].children = subfolders;
                    } else { // folder is empty
                        delete dataObj[shortName];
                    }
                }

                let usedImport = importCountArray.find(element => element.fileName === key);
                if (usedImport) {
                    // foundAtLeastOneEntry = true;

                    dataObj[shortName].adds = {
                        "link": path.join("../".repeat(slashCount + 2), combinedPath, shortName) + ".html?module=" + dependencyName,
                        "imports": usedImport.importDeclaration.isEntireModuleImported() ?
                            ["*"] : usedImport.importDeclaration.getImportSpecifiers()
                    }
                }
            });

            // return foundAtLeastOneEntry ? dataObj : undefined;
            return dataObj;
        }
    }

    static generateFileContent(importCounts: ImportCount[], shortFileName: string, date: Date) {
        const formattedContent = importCounts[0].sourceFile.text
            .replace(/</gi, "&lt;")
            .replace(/>/gi, "&gt;");
        const lineCount = (formattedContent.match(/\n/g) || []).length;
        const compiledFunction = pug.compileFile(path.join(__dirname, HTML_TEMPLATE_FILES.CODE));
        const slashCount = (shortFileName.match(/\\/g) || []).length;

        return compiledFunction({
            title: 'File: ' + shortFileName,
            folder: '../'.repeat(slashCount),
            sourceCode: formattedContent,
            lineCount: lineCount,
            date: date
        });
    }

}