import * as chai from 'chai';
import 'mocha';
import {ImportDeclaration} from "../../../src/Declarations";
import {DependencyAnalyser} from "../../../src/DependencyAnalyser";

const expect = chai.expect;
const fileName = __dirname + "\\imports.ts";

describe('Test Imports', () => {

    let dependencyAnalyser = new DependencyAnalyser(fileName);
    dependencyAnalyser.initDtsCreator();
    dependencyAnalyser.scanAllFiles();
    let importScanner = dependencyAnalyser.importScannerMap.get(fileName);
    let importMap = importScanner.importMap;

    it('import * as myName from "./simpleExports"' , () => {
        expect(
            (<ImportDeclaration>importMap.get("myName")).getModuleSpecifier()
        ).to.equal("./simpleExports");
        expect(
            (<ImportDeclaration>importMap.get("myName")).getImportSpecifiers()[0]
        ).to.equal("myName");
    });

    it('import {MyClass} from "./simpleExports"' , () => {
        expect(
            (<ImportDeclaration>importMap.get("MyClass")).getModuleSpecifier()
        ).to.equal("./simpleExports");
        expect(
            (<ImportDeclaration>importMap.get("MyClass")).getImportSpecifiers()[0]
        ).to.equal("MyClass");
    });

    it('import {MyClass as MyAlias, myFunction} from "./simpleExports"' , () => {
        expect(
            (<ImportDeclaration>importMap.get("MyAlias")).getModuleSpecifier()
        ).to.equal("./simpleExports");
        expect(
            (<ImportDeclaration>importMap.get("MyAlias")).getImportSpecifiers()[0]
        ).to.equal("MyAlias");
        expect(
            (<ImportDeclaration>importMap.get("myFunction")).getModuleSpecifier()
        ).to.equal("./simpleExports");
        expect(
            (<ImportDeclaration>importMap.get("myFunction")).getImportSpecifiers()[1]
        ).to.equal("myFunction");
    });

    it('import MyDefaultClass, {anotherClass, aFunction as anotherFunction} from "./defaultExport"' , () => {
        expect(
            (<ImportDeclaration>importMap.get("MyDefaultClass")).getModuleSpecifier()
        ).to.equal("./defaultExport");
        expect(
            (<ImportDeclaration>importMap.get("MyDefaultClass")).getImportSpecifiers()[0]
        ).to.equal("MyDefaultClass");
        expect(
            (<ImportDeclaration>importMap.get("anotherClass")).getModuleSpecifier()
        ).to.equal("./defaultExport");
        expect(
            (<ImportDeclaration>importMap.get("anotherClass")).getImportSpecifiers()[1]
        ).to.equal("anotherClass");
        expect(
            (<ImportDeclaration>importMap.get("anotherFunction")).getModuleSpecifier()
        ).to.equal("./defaultExport");
        expect(
            (<ImportDeclaration>importMap.get("anotherFunction")).getImportSpecifiers()[2]
        ).to.equal("anotherFunction");
    });

    it('import myDefaultClass2, * as myName2 from "./defaultExport2"' , () => {
        expect(
            (<ImportDeclaration>importMap.get("myDefaultClass2")).getModuleSpecifier()
        ).to.equal("./defaultExport2");
        expect(
            (<ImportDeclaration>importMap.get("myDefaultClass2")).getImportSpecifiers()[0]
        ).to.equal("myDefaultClass2");
        expect(
            (<ImportDeclaration>importMap.get("myName2")).getModuleSpecifier()
        ).to.equal("./defaultExport2");
        expect(
            (<ImportDeclaration>importMap.get("myName2")).getImportSpecifiers()[1]
        ).to.equal("myName2");
    });

    // it('import "./simpleExports"' , () => {
    //     expect(
    //         (<ImportDeclaration>importMap.get("")).getModuleSpecifier()
    //     ).to.equal("./simpleExports");
    //     expect(
    //         (<ImportDeclaration>importMap.get("")).getImportSpecifiers()[0]
    //     ).to.equal("");
    // });

});