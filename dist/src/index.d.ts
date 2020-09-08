#!/usr/bin/env node
export interface Options {
    rootDir: string;
    targetDir: string;
    scanDir: string;
    nodeModulesDir: string;
    exclude: string[];
    fileExtensionFilter: string[];
}
