import * as ts from "typescript";
import * as fs from "fs";
import {ImportScanner} from "../../../src/importService";
import * as chai from 'chai';
import 'mocha';
import {ImportDeclaration} from "../../../src/Declarations";

const expect = chai.expect;

const sourceFile = ts.createSourceFile(
    'simpleImport.ts', // fileName
    fs.readFileSync(__dirname + "\\imports.ts", 'utf8'), // sourceText
    ts.ScriptTarget.Latest, // languageVersion
    false
);

describe('Test imports', () => {

    let importScanner = new ImportScanner(sourceFile);
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

    // it('import "./simpleExports"' , () => {
    //     expect(
    //         (<ImportDeclaration>importMap.get("")).getModuleSpecifier()
    //     ).to.equal("./simpleExports");
    //     expect(
    //         (<ImportDeclaration>importMap.get("")).getImportSpecifiers()[0]
    //     ).to.equal("");
    // });

});