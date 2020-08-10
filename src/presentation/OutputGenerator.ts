import * as pug from "pug";
import * as getSizes from "package-size";
import * as path from "path";
import * as fs from "fs";
import {CountService} from "./CountService";
import {ImportCount, UsageCount} from "./Counter";

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
        const allDependencies: object = this.countService.dependencyAnalyser.packageJson["dependencies"];
        this.date = new Date();

        this.cleanRootFolder();
        this.createComplements();

        // create index file
        new Promise<any>(resolve => {
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
            const relativePath = path.relative(scanDir, filePath);
            const fileName = path.join(targetDir, "details", relativePath) + ".html";
            const usageCountArray = this.countService.groupUsageByFileName().get(filePath);

            this.createHtmlFile(fileName, this.generateFileContent(importCountArray, usageCountArray, relativePath));
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

    private async generateIndex(dependencies: Map<string, ImportCount[]>, allDependencies: object): Promise<any> {
        // Compile the source code
        const compiledFunction = pug.compileFile(path.join(__dirname, HTML_TEMPLATE_FILES.INDEX));
        const nodeModulesPath = this.countService.dependencyAnalyser.options.nodeModulesDir;
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
            } else {
                dependencyData.push({name: key, count: value.length});
            }
        });

        // calculate sizes of  dependencies
        let promisesArray = [];

        dependencyData.forEach(value => {

            // prepare chart data for [dependency -> imports in files]
            chartData[0].data.push([value.name, value.count]);

            promisesArray.push(
                getSizes(value.name, {
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
                })
            );
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

        await Promise.all(promisesArray);

        // add missing size info
        dependencyData.forEach(dependency => {
            if (!dependency.sizeInfo) {
                dependency.sizeInfo = {
                    sizeOnDisk: convertToKb(getSizeOnDiskRek(path.join(nodeModulesPath, dependency.name))),
                    sizeInKB: 0,
                    minifiedInKB: 0,
                    gzippedInKB: 0,
                    sizeInfo: 0
                }
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

        function convertToKb(x: number): string {
            // return parseFloat((x / 1024).toFixed(x / 1024 < 0.1 ? 3 : 1));
            // return new Intl.NumberFormat(
            //     Intl.NumberFormat().resolvedOptions().locale, {
            //         maximumFractionDigits: 1
            //     }
            // ).format(x / 1024);
            return (x / 1024).toLocaleString("en-US", {
                minimumFractionDigits: 1,
                maximumFractionDigits: 1
            });
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
    }

    private generateModules(dependencyName: string, importCountArray: ImportCount[]): any {
        const compiledFunction = pug.compileFile(path.join(__dirname, HTML_TEMPLATE_FILES.MODULE));
        const slashCount = (dependencyName.match(/\//g) || []).length;
        const filesObject = this.countService.dependencyAnalyser.filesObject;

        // Prepare Data
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
                        "link": path.join("../".repeat(slashCount + 1), combinedPath, shortName) + ".html?module="
                            + dependencyName + "&imports=" + usedImport.importDeclaration.getImportSpecifiers().join(","),
                        "imports": usedImport.importDeclaration.isEntireModuleImported() ?
                            ["*"] : usedImport.importDeclaration.getImportSpecifiers()
                    }
                }
            });

            return dataObj;
        }
    }

    private generateFileContent(importCounts: ImportCount[], usageCountArray: UsageCount[], shortFileName: string): any {
        const compiledFunction = pug.compileFile(path.join(__dirname, HTML_TEMPLATE_FILES.CODE));
        const formattedContent = importCounts[0].sourceFile.text;
        const lineCount = (formattedContent.match(/\n/g) || []).length;
        const slashCount = (shortFileName.match(/\\/g) || []).length;
        const importsArray = [];
        const usageArray = [];
        const countMap = new Map<string, number>();
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
        if (!usageCountArray) usageCountArray = [];
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
            countArray[0].push({role: 'annotation'});
            countArray[1].push(value[1]);
            countArray[1].push(value[1].toString());
        });

        return compiledFunction({
            title: 'File: ' + shortFileName,
            shortFileName: shortFileName,
            folder: '../'.repeat(slashCount + 1),
            sourceCode: formattedContent,
            lineCount: lineCount,
            importsArray: importsArray,
            usageArray: usageArray,
            countArray: countArray,
            date: this.date
        });

        function getLineCountToOccurrence(endPosition: number): number {
            const code = formattedContent.substring(0, endPosition);
            return (code.match(/\n/g) || []).length + 1;
        }
    }

}