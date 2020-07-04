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
        let dependencyFileNameMap = countService.groupByFileName();
        let dependencyNameMap = countService.groupByDependencyName();

        // INDEX
        // dependencyNameMap.forEach((value, key) => {
        //     content += `<li>\n<a class="uk-accordion-title" href="#">${key} <span class="uk-badge">${value.length}</span></a>\n<div class="uk-accordion-content"><ul class="uk-list uk-list-disc">`;
        //     value.forEach(importCount => {
        //         let shortFileName = importCount.fileName.replace(sPath, "");
        //         let htmlFileName = path.join("details", shortFileName) + ".html";
        //         content += `<li><a href="${htmlFileName}">${shortFileName}</a></li>\n`;
        //     })
        //     content += "</ul></div></li>";
        // });
        //
        // const outputHTML = indexHtml.replace("$CONTENT$", content);
        const outputHTML = this.generateIndex(dependencyNameMap);
        this.cleanRootFolder(rootPath);
        this.createComplements(rootPath);
        this.createHtmlFile(path.join(rootPath, "index.html"), outputHTML);

        // FILES
        dependencyFileNameMap.forEach((value, key) => {
            let shortFileName = key.replace(sPath, ""); //.replace("\.ts", ".html");
            const fileName = path.join(rootPath, "details", shortFileName) + ".html";
            console.log("fileName", fileName);
            // this.createHtmlFile(fileName, JSON.stringify(value, null, '\t'));
            this.createHtmlFile(fileName, this.generateFileContent(value));
        });

        // MODULES
        dependencyNameMap.forEach(importCountArray => {
            importCountArray.forEach(importCount => {
                const fileName = path.join(rootPath, "modules", importCount.dependencyName) + ".html";
                let content = this.generateModules(importCount, filesTree);
                // let content: string = "";
                //
                // createHTMLFileTreeRek(filesTree);
                this.createHtmlFile(fileName, content);
                //
                // function createHTMLFileTreeRek (filesMap: Map<string, object>) {
                //     content += "<ul>";
                //     filesMap.forEach((value, key) => {
                //         if (value) { // it's a folder
                //             content += `<li>${path.parse(key).base}`;
                //             createHTMLFileTreeRek(<Map<string, object>>value);
                //             content += `</li>`;
                //         } else { // it's a file
                //             content += `<li>${path.parse(key).base}</li>`
                //         }
                //     })
                //     content += "</ul>"
                // }
            })

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

    static createComplements(sPath: string) {
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
        })

    }

    static generateIndex(dependencies: Map<string, ImportCount[]>) {
        // Compile the source code
        const compiledFunction = pug.compileFile('src/presentation/templates/html/index/content.pug');
        const chartData = [{
            elementId: "dependenciesChart",
            data: [["", ""]]
        }];

        // Prepare data
        let dependencyData = [];
        dependencies.forEach((value, key) => {
            dependencyData.push({name: key, count: value.length});
        });

        dependencyData.sort((a, b) => {
            return b.count - a.count;
        });

        dependencyData.forEach(value => {
            chartData[0].data.push([value.name, value.count]);
        });

        // Render a set of data
        return compiledFunction({
            title: 'Overview',
            folder: './',
            chartData: chartData,
            dependencies: dependencyData
        });
    }

    static generateModules(importCount: ImportCount, filesTree: Map<string, object>) {
        // Compile the source code
        const compiledFunction = pug.compileFile('src/presentation/templates/html/module/module.pug');

        let x = {
            "common": {
                children: {
                    "api.ts": {},
                    "emitter.ts": {},
                    "http.ts": {},
                    "util.ts": {
                        adds: {
                            link: "../details/common/util.ts.html",
                            imports: ["*"]
                        }
                    }
                }
            },
            "node": {
                children: {
                    "app": {
                        children: {
                            "api.ts": {
                                adds: {
                                    link: "../details/node/app/api.ts.html",
                                    imports: ["field", "logger"]
                                }
                            },
                            "bin.ts": {},
                            "dashboard.ts": {},
                            "login.ts": {},
                            "proxy.ts": {},
                            "static.ts": {},
                            "update.ts": {
                                adds: {
                                    link: "../details/node/app/update.ts.html",
                                    imports: ["Application", "ApplicationsResponse", "ClientMessage", "RecentResponse", "ServerMessage", "SessionError", "SessionRespons", "Application", "ApplicationsResponse", "ClientMessage", "RecentResponse", "ServerMessage", "SessionError", "SessionRespons"]
                                }
                            },
                            "vscode.ts": {}
                        }
                    },
                    "cli.ts": {},
                    "entry.ts": {},
                    "http.ts": {},
                    "settings.ts": {},
                    "socket.ts": {},
                    "util.ts": {},
                    "wrapper.ts": {}
                }
            }
        }

        // Render a set of data
        return compiledFunction({
            title: 'Module: ' + importCount.dependencyName,
            moduleName: importCount.dependencyName,
            folder: '../',
            filesTree: x
        });
    }

}