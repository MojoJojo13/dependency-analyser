import * as ts from "typescript";
import {ImportScanner} from "../../../src/importService";
import * as chai from 'chai';
import 'mocha';
import * as fs from "fs";
import {DependencyAnalyser} from "../../../src/DependencyAnalyser";

const expect = chai.expect;
const fileName = __dirname + "\\imports.ts";

describe('Test Class Stuff', () => {

    let dependencyAnalyser = new DependencyAnalyser(fileName);
    dependencyAnalyser.initDtsCreator();
    dependencyAnalyser.scanAllFiles();

    it('should be able to add things correctly' , () => {

    });

});