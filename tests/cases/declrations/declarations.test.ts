import * as chai from 'chai';
import 'mocha';
import {DependencyAnalyser} from "../../../src/DependencyAnalyser";

const expect = chai.expect;
const fileName = __dirname + "\\imports.ts";

describe('Test Declaration Stuff', () => {

    let dependencyAnalyser = new DependencyAnalyser(fileName);
    dependencyAnalyser.initDtsCreator();
    dependencyAnalyser.scanAllFiles();

    // let a = dependencyAnalyser.moduleSourceFileMap.get(fileName);
    // console.log(a.getMemberMap());

    // let importMap = dependencyAnalyser.importScannerMap.get(fileName).importMap;
    // console.log("importMap", importMap);
    //
    // it('let myClass0 = new MyClass();', () => {
    //     expect(importMap.get("myClass0").reference).to.equal("MyClass");
    // });
    //
    // it('let myClass1: MyClass = new MyClass();', () => {
    //     expect(importMap.get("myClass1").reference).to.equal("MyClass");
    // });
    //
    // it('let myClass0 = new MyClass();', () => {
    //     expect(importMap.get("myClass2").reference).to.equal("MyClass");
    // });

    it('let myClass0 = new MyClass();', () => {

    });

});