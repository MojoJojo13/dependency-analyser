import * as chai from 'chai';
import 'mocha';
import {DependencyAnalyser} from "../../../src/DependencyAnalyser";
import {Options} from "../../../src";

const expect = chai.expect;
const fileName = __dirname + "\\imports.ts";
console.log("fileName");

describe('Test Class Stuff', () => {

    let option: Options = {
        exclude: [],
        fileExtensionFilter: [],
        nodeModulesDir: "",
        rootDir: "",
        scanDir: fileName,
        targetDir: ""
    };

    let dependencyAnalyser = new DependencyAnalyser(option);
    dependencyAnalyser.initDtsCreator();
    dependencyAnalyser.scanAllFiles();

    it('should be able to add things correctly' , () => {

    });

});