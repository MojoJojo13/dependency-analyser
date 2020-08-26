#!/usr/bin/env node
import * as fs from "fs";
import * as path from "path";
import * as yargs from "yargs";
import {DependencyAnalyser} from "./main/DependencyAnalyser";

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

const dependencyAnalyser = new DependencyAnalyser(options);
dependencyAnalyser.scanAllFiles();
dependencyAnalyser.generateOutput();
