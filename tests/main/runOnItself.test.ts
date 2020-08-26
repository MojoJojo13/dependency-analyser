import * as chai from 'chai';
import 'mocha';
import {Options} from "../../src";
import {DependencyAnalyser} from "../../src/main/dependencyAnalyser";

const expect = chai.expect;

describe('Scan the project itself and generate analysis', () => {

    let option: Options = {
        exclude: [ '\\\\node_modules$', '\\..*' ],
        fileExtensionFilter: [".ts"],
        nodeModulesDir: 'node_modules',
        rootDir: ".\\",
        scanDir: "src",
        targetDir: "dependency-analysis"
    };

    let dependencyAnalyser = new DependencyAnalyser(option);
    dependencyAnalyser.scanAllFiles();
    dependencyAnalyser.generateOutput();

});