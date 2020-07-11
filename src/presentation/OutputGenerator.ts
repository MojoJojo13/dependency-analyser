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

    countService: CountService;
    private date: Date;

    constructor(countService: CountService) {
        this.countService = countService;
    }

    generateHTML(): void {
        const dependencyFileNameMap = this.countService.groupByFileName();
        const dependencyNameMap = this.countService.groupByDependencyName();
        const scanDir = this.countService.dependencyAnalyser.options.scanDir;
        const targetDir = this.countService.dependencyAnalyser.options.targetDir;

        this.date = new Date();

        this.cleanRootFolder();
        this.createComplements();

        // create index file
        new Promise<any>(resolve => {
            resolve(this.generateIndex(dependencyNameMap));
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
            const relativePath = path.relative(scanDir, filePath);
            const fileName = path.join(targetDir, "details", relativePath) + ".html";

            this.createHtmlFile(fileName, this.generateFileContent(importCountArray, relativePath));
        });

    }

    private createFolder(dirPath: string): void {
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, {recursive: true});
        }
    }

    private cleanRootFolder(): void {
        const tarPath = this.countService.dependencyAnalyser.options.targetDir;

        if (!fs.existsSync(tarPath)) {
            fs.mkdirSync(tarPath);
        } else {
            // fs.rmdirSync(tarPath, {recursive: true});
            // fs.mkdirSync(tarPath);
        }
    }

    private createHtmlFile(sPath: string, content: string): void {
        this.createFolder(path.dirname(sPath));

        fs.writeFile(sPath, content, (err) => {
            if (err) throw err;
        });
    }

    private createComplements(): void {
        const targetDir = this.countService.dependencyAnalyser.options.targetDir;

        COMPLEMENT_FILES.forEach(value => {
            const source = path.join(__dirname, value);
            const destination = path.join(targetDir, path.parse(value).base);

            fs.copyFileSync(source, destination);
        });
    }

    private async generateIndex(dependencies: Map<string, ImportCount[]>): Promise<any> {
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

            const nodeModulesPath = this.countService.dependencyAnalyser.options.nodeModulesDir;

            chartData[0].data.push([value.name, value.count]);

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
                        return (x / 1024).toFixed(x / 1024 < 0.1 ? 3 : 1);
                    }

                    function getSizeOnDiskRek(dirPath: string) {
                        let size = 0;
                        let itemStats = fs.lstatSync(dirPath);

                        if (itemStats.isDirectory()) {
                            let allSubs = fs.readdirSync(dirPath);
                            {
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
            date: this.date
        });
    }

    private generateModules(dependencyName: string, importCountArray: ImportCount[]): any {
        const compiledFunction = pug.compileFile(path.join(__dirname, HTML_TEMPLATE_FILES.MODULE));
        const slashCount = (dependencyName.match(/\//g) || []).length;
        // const filesTree = this.countService.dependencyAnalyser.filesTree;
        const filesObject = this.countService.dependencyAnalyser.filesObject;

        // Prepare Data
        // const convertedData = transformDataRek(filesObject, "dependency-analysis/details");
        // console.log("filesObject", );
        const convertedData = fillUpData(filesObject, "details");


        // Render a set of data
        return compiledFunction({
            title: 'Module: ' + dependencyName,
            moduleName: dependencyName,
            folder: '../'.repeat(slashCount + 1),
            filesTree: convertedData,//convertedData,
            date: this.date
        });

        function fillUpData(filesObject, combinedPath: string): any {
            let dataObj = {};

            Object.keys(filesObject).forEach((key) => {
                const shortName = path.parse(key).base;
                dataObj[shortName] = {};

                if (filesObject[key] && filesObject[key].children) {
                    let subfolders = fillUpData(filesObject[key].children, path.join(combinedPath, shortName));
                    dataObj[shortName].children = subfolders;
                }

                let usedImport = importCountArray.find(element => element.fileName === key);
                if (usedImport) {

                    dataObj[shortName].adds = {
                        "link": path.join("../".repeat(slashCount + 1), combinedPath, shortName) + ".html?module=" + dependencyName,
                        "imports": usedImport.importDeclaration.isEntireModuleImported() ?
                            ["*"] : usedImport.importDeclaration.getImportSpecifiers()
                    }
                }
            });

            return dataObj;
        }

        // Transforms the files tree map to an object with all necessary info for the frontend
        // function transformDataRek(filesTree, combinedPath: string): any {
        //     let dataObj = {};
        //
        //     filesTree.forEach((value, key) => {
        //         const extension = path.parse(key).ext;
        //         if (extension && extension !== ".ts") return; // remove non .ts files
        //
        //         const shortName = path.parse(key).base;
        //         dataObj[shortName] = {};
        //
        //         if (value) { // check if it's a folder
        //             let subfolders = transformDataRek(<Map<string, object>>value, path.join(combinedPath, shortName));
        //
        //             if (Object.keys(subfolders).length) { // folder not empty
        //                 dataObj[shortName].children = subfolders;
        //             } else { // folder is empty
        //                 delete dataObj[shortName];
        //             }
        //         }
        //
        //         let usedImport = importCountArray.find(element => element.fileName === key);
        //         if (usedImport) {
        //
        //             filesTree[shortName].adds = {
        //                 "link": path.join("../".repeat(slashCount + 2), combinedPath, shortName) + ".html?module=" + dependencyName,
        //                 "imports": usedImport.importDeclaration.isEntireModuleImported() ?
        //                     ["*"] : usedImport.importDeclaration.getImportSpecifiers()
        //             }
        //         }
        //     });
        //
        //     return filesTree;
        // }
    }

    private generateFileContent(importCounts: ImportCount[], shortFileName: string): any {
        const formattedContent = importCounts[0].sourceFile.text
        // .replace(/</gi, "&lt;")
        // .replace(/>/gi, "&gt;");
        const lineCount = (formattedContent.match(/\n/g) || []).length;
        const compiledFunction = pug.compileFile(path.join(__dirname, HTML_TEMPLATE_FILES.CODE));
        const slashCount = (shortFileName.match(/\\/g) || []).length;

        return compiledFunction({
            title: 'File: ' + shortFileName,
            folder: '../'.repeat(slashCount + 1),
            sourceCode: formattedContent,
            lineCount: lineCount,
            date: this.date
        });
    }

}