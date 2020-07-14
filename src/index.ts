#!/usr/bin/env node
import * as fs from "fs";
import * as path from "path";
import * as ts from "typescript";
import {FileHandler} from "./fileHandler";
import {DependencyAnalyser} from "./DependencyAnalyser";

console.log("__dirname", __dirname);
console.log('process.argv', process.argv);
// console.log('process.argv', process.argv.slice(2));

const yargs = require("yargs");

export interface Options {
    rootDir: string,
    targetDir: string,
    scanDir: string,
    nodeModulesDir: string,
    exclude: string[],
    fileExtensionFilter: string[]
}

const NODE_MODULES = "node_modules";

const options: Options = {
    rootDir: "",
    scanDir: "",
    targetDir: "",
    nodeModulesDir: "",
    exclude: ["\\\\node_modules$", "\\\..*"],
    fileExtensionFilter: [".ts"]
};

const argv: { root?, tar?, scan? } = yargs
    .usage("Usage: dependency-analyser [options]")
    .example("dependency-analyser --root C:/User/Projects/your_project", "")
    .example("dependency-analyser --root C:/User/Projects/your_project --scan C:/User/Projects/your_project/src", "")
    .option('root', {
        alias: 'r',
        type: 'string',
        description: 'Root directory of your project.'
    }).option('scan', {
        alias: 's',
        type: 'string',
        description: 'Directory to scan.'
    }).option('tar', {
        alias: 't',
        type: 'string',
        description: 'Target directory to put generated files into.'
    })
    .alias('h', 'help')
    .showHelpOnFail(true)
    .help()
    .argv

// determine the root directory
if (argv.root) {
    options.rootDir = argv.root;
} else {
    const split = process.argv[1].split(NODE_MODULES);

    if (split.length < 2) {
        console.error("Could not find the root folder. Please provide the root path in the arguments.");
        process.exit(1);
    }

    options.rootDir = path.normalize(split[0]);
}

// set node_modules directory
options.nodeModulesDir = path.join(options.rootDir, NODE_MODULES);

// check if the determined directory exists
if (!fs.existsSync(options.rootDir)) {
    console.error("The provided root directory does not exist.", options.rootDir);
    process.exit(1);
}

// determine scan directory or file
if (argv.scan) {
    if (path.isAbsolute(argv.scan)) {
        options.scanDir = argv.scan;
    } else {
        options.scanDir = path.join(options.rootDir, argv.scan);
    }
} else {
    options.scanDir = options.rootDir;
}

// check if the determined directory exists
if (!fs.existsSync(options.scanDir)) {
    console.error("The provided directory to scan does not exist.", options.scanDir);
    process.exit(1);
}

// determine target directory
if (argv.tar) {
    options.targetDir = argv.tar;
} else {
    options.targetDir = path.join(options.rootDir, "dependency-analysis");
}

// check if the target directory is valid
// TODO: check for directory

console.log("options", options);

// process.exit();

// let outputPath = "C:\\Users\\Paul\\WebstormProjects\\dependency-analyser\\dependency-analysis";
// let sPath = "C:\\Users\\Paul\\Documents\\Git\\Uni Projects\\code-server\\src";
// console.log("sPath", sPath);

const dependencyAnalyser = new DependencyAnalyser(options);
dependencyAnalyser.initDtsCreator();
// console.log("Array.from(dependencyAnalyser.dtsCreator.dtsFileMap.keys())", Array.from(dependencyAnalyser.dtsCreator.dtsFileMap.keys()));
dependencyAnalyser.scanAllFiles();
// console.log(dependencyAnalyser.countService.importCounts);
// console.log(dependencyAnalyser.countService.groupByFileName());
// console.log(dependencyAnalyser.countService.groupByDependencyName());
dependencyAnalyser.generateOutput();
