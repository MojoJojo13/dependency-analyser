import * as chai from 'chai';
import 'mocha';
import {DependencyAnalyser} from "../../../src/DependencyAnalyser";

const expect = chai.expect;
const fileName = __dirname + "\\imports.ts";
console.log("fileName");

describe('Test Class Stuff', () => {

    let dependencyAnalyser = new DependencyAnalyser(fileName);
    dependencyAnalyser.initDtsCreator();
    dependencyAnalyser.scanAllFiles();

    it('should be able to add things correctly' , () => {

    });

});