import * as chai from 'chai';
import 'mocha';
import {DependencyAnalyser} from "../src/DependencyAnalyser";

const expect = chai.expect;

const fileName = "C:\\Users\\Paul\\WebstormProjects\\dependency-analyser\\tests\\cases\\classes\\imports.ts";
const dirName = "C:\\Users\\Paul\\WebstormProjects\\dependency-analyser\\src";

describe('Dependency Analyser', () => {

    // it('init file' , () => {
    //     let dependencyAnalyser = new DependencyAnalyser(fileName);
    //     dependencyAnalyser.initDtsCreator();
    //     dependencyAnalyser.scanAllFiles();
    // });

    // it('init directory' , () => {
    //     let dependencyAnalyser = new DependencyAnalyser(dirName);
    //         console.log("allFiles", dependencyAnalyser.allFiles);
    //         dependencyAnalyser.initDtsCreator();
    //         console.log("Array.from(dependencyAnalyser.dtsCreator.dtsFileMap.keys())", Array.from(dependencyAnalyser.dtsCreator.dtsFileMap.keys()));
    //         dependencyAnalyser.scanAllFiles();
    //
    // });

});