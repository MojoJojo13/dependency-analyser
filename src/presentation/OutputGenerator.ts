import {CountService} from "./CountService";
import * as fs from "fs";
import * as path from "path";
import {ImportCount} from "./Counter";
import * as pug from "pug";

// const pug = require('pug');

const baseHTML = `<!DOCTYPE html>\n<html><head><meta charset="utf-8"/><link rel=\"stylesheet\" href=\"uikit.min.css"><script src="uikit.min.js"></script></head>\n<body>\n$CONTENT$</body>\n</html>`;
const indexHtml = baseHTML.replace("$CONTENT$", "<div class=\"uk-container\">\n<ul uk-accordion=\"multiple: true\">\n$CONTENT$</ul></div>");

export class OutputGenerator {

    static generateHTML(countService: CountService, sPath: string, rootPath: string, filesTree: Map<string, object>) {
        const date: Date = new Date();
        const dependencyFileNameMap = countService.groupByFileName();
        const dependencyNameMap = countService.groupByDependencyName();

        this.cleanRootFolder(rootPath);
        this.createComplements(rootPath);

        // INDEX
        const outputHTML = this.generateIndex(dependencyNameMap, date);
        this.createHtmlFile(path.join(rootPath, "index.html"), outputHTML);

        // FILES
        dependencyFileNameMap.forEach((value, key) => {
            const shortFileName = key.replace(sPath, "");
            const fileName = path.join(rootPath, "details", shortFileName) + ".html";

            this.createHtmlFile(fileName, this.generateFileContent(value));
        });

        // MODULES
        dependencyNameMap.forEach((importCountArray, dependencyName) => {
            const fileName = path.join(rootPath, "modules", dependencyName) + ".html";
            const content = this.generateModules(dependencyName, importCountArray, filesTree, date);

            this.createHtmlFile(fileName, content);

            // console.log("require.resolve", require.resolve(dependencyName, {paths: ["C:\\Users\\Paul\\Documents\\Git\\Uni Projects\\code-server"]}));
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

    static generateFileContent(importCounts: ImportCount[]) {
        let formattedContent = importCounts[0].sourceFile.text
            .replace(/</gi, "&lt;")
            .replace(/>/gi, "&gt;");
        let abc = '<script src=\"https://cdn.jsdelivr.net/gh/google/code-prettify@master/loader/run_prettify.js\"></script>\n' +
            '<pre class=\"prettyprint linenums lang-js\">$CONTENT$</pre>'.replace("$CONTENT$", formattedContent);
        return baseHTML.replace("$CONTENT$", abc);
    }

    static createComplements(sPath: string): void {
        const files = [
            "src\\presentation\\templates\\uikit\\uikit.min.css",
            "src\\presentation\\templates\\uikit\\uikit.min.js",
            "src\\presentation\\templates\\uikit\\uikit-icons.min.js",
            "src\\presentation\\templates\\css\\custom.css",
            "src\\presentation\\templates\\js\\custom.js"
        ];

        files.forEach(value => {
            const source = value;
            const destination = path.join(sPath, path.parse(value).base);

            fs.copyFileSync(source, destination);
        });
    }

    static generateIndex(dependencies: Map<string, ImportCount[]>, date: Date): any {
        // Compile the source code
        const compiledFunction = pug.compileFile('src/presentation/templates/html/index/content.pug');
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

        dependencyData.forEach(value => {
            chartData[0].data.push([value.name, value.count]);
        });

        nodeModulesData.forEach(value => {
            chartData[1].data.push([value.name, value.count]);
        });

        // customModulesData.forEach(value => {
        //     chartData[2].data.push([value.name, value.count]);
        // });

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
        const compiledFunction = pug.compileFile('src/presentation/templates/html/module/module.pug');
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
                        "link": path.join("../".repeat(slashCount + 2), combinedPath, shortName) + ".html",
                        "imports": usedImport.importDeclaration.isEntireModuleImported() ?
                            ["*"] : usedImport.importDeclaration.getImportSpecifiers()
                    }
                }
            });

            // return foundAtLeastOneEntry ? dataObj : undefined;
            return dataObj;
        }


    }

}