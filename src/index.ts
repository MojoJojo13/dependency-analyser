#!/usr/bin/env node

import {ExportScanner, findExportDeclarations} from "./exportService";
import {ImportScanner} from "./importService";

console.log('process.argv', process.argv);
console.log('process.argv', process.argv.slice(2));

import * as fs from "fs";
import * as path from "path";
import * as ts from "typescript";
import {FileHandler} from "./fileHandler";
import {DependencyAnalyser} from "./DependencyAnalyser";


let sPath = "C:\\Users\\Paul\\Documents\\Git\\Uni Projects\\code-server\\src\\node\\entry.ts";
// let sPath = "C:\\Users\\Paul\\WebstormProjects\\dependency-analyser\\tests\\cases\\imports.ts";
// let sPath = "C:\\Users\\Paul\\WebstormProjects\\dependency-analyser\\dist\\exports.d.ts";
// let sPath = "C:\\Users\\Paul\\WebstormProjects\\dependency-analyser\\dist\\exportService.d.ts";
// let sPath = "C:\\Users\\Paul\\WebstormProjects\\dependency-analyser\\node_modules\\typescript\\lib\\typescript.d.ts";
// let sPath = "C:\\Users\\Paul\\WebstormProjects\\local-consumer\\src\\simpleImport.ts";
//let sPath = path.join(path.dirname(process.argv[1]), "../../../", process.argv[2]);
console.log("sPath", sPath);

const rootNode = ts.createSourceFile(
    'simpleImport.ts', // fileName
    fs.readFileSync(sPath, 'utf8'), // sourceText
    ts.ScriptTarget.Latest, // languageVersion
    false
);

let dependencyAnalyser = new DependencyAnalyser(sPath);
dependencyAnalyser.initDtsCreator();
dependencyAnalyser.scanAllFiles();

// let pathToModule1 = require.resolve("typescript");
// console.log("pathToModule1", pathToModule1);
//
// let pathToModule2 = require.resolve("fs");
// console.log("pathToModule2", pathToModule2);
//
// let pathToModule3 = require.resolve("./Declarations");
// console.log("pathToModule3", pathToModule3);

// new FileHandler(sPath);

// printChildren(rootNode);
// console.log("----------------------------------------------------------------------------------------------------");
// let exportScanner = new ExportScanner();
// exportScanner.scanFile(rootNode);
// console.log("----------------------------------------------------------------------------------------------------");
//
// let sPathImports = "C:\\Users\\Paul\\WebstormProjects\\dependency-analyser\\tests\\cases\\imports.ts"
// console.log("sPath", sPath);
//
// const rootNodeImports = ts.createSourceFile(
//     'imports.ts',   // fileName
//     fs.readFileSync(sPathImports, 'utf8'), // sourceText
//     ts.ScriptTarget.Latest, // languageVersion
//     false
// );
// printChildren(rootNodeImports);
console.log("----------------------------------------------------------------------------------------------------");
// let importScanner = new ImportScanner(rootNode);

// Run the compiler
// let sPath0 = "C:\\Users\\Paul\\WebstormProjects\\dependency-analyser\\tests\\cases\\exports.ts";
// compile([sPath0], {
//     allowJs: true,
//     declaration: true,
//     emitDeclarationOnly: true,
// });

// function compile(fileNames: string[], options: ts.CompilerOptions): void {
//     // Create a Program with an in-memory emit
//     // const createdFiles = {}
//     // const host = ts.createCompilerHost(options);
//     // host.writeFile = (fileName: string, content: string) => {
//     //     console.log("fileName", fileName);
//     //     console.log("content", content);
//     //
//     //     const dts = ts.createSourceFile(
//     //         fileName,   // fileName
//     //         content,
//     //         ts.ScriptTarget.Latest, // languageVersion
//     //         false
//     //     );
//     //
//     //     printChildren(dts);
//     //     let exportScanner = new ExportScanner();
//     //     exportScanner.scanFile(dts);
//     // }
//     // createdFiles[fileName.replace(".js", ".d.ts")] = content
//
//     // Prepare and emit the d.ts files
//     // const program = ts.createProgram(fileNames, options, host);
//     // program.emit();
//
//     // // Loop through all the input files
//     // fileNames.forEach(file => {
//     //     console.log("### JavaScript\n")
//     //     console.log(host.readFile(file))
//     //
//     //     console.log("### Type Definition\n")
//     //     const dts = file.replace(".js", ".d.ts")
//     //     console.log(createdFiles[dts])
//     // })
// }


export function add(x: number, y: number) {
    return x + y;
}