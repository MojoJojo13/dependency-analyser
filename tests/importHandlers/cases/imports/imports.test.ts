import * as chai from 'chai';
import 'mocha';
import {DependencyAnalyser} from "../../../../src/main/dependencyAnalyser";
import {Options} from "../../../../src";

const expect = chai.expect;
const fileName = __dirname + "\\imports.ts";

describe('Test module imports', () => {

    let option: Options = {
        exclude: [],
        fileExtensionFilter: [".ts"],
        nodeModulesDir: "",
        rootDir: "",
        scanDir: fileName,
        targetDir: ""
    };

    let dependencyAnalyser = new DependencyAnalyser(option);
    dependencyAnalyser.scanAllFiles();

    let importCounts = dependencyAnalyser.countService.importCounts;

    it('import * as ts from "typescript"', () => {
        const importDeclaration = importCounts[0].importDeclaration;

        expect(importDeclaration.getModuleSpecifier()).to.equal("typescript");
        expect(importDeclaration.getImportSpecifiers()[0]).to.equal("ts");
        expect(importDeclaration.isEntireModuleImported()).to.true;
    });

    it('import {Agent} from "http"', () => {
        const importDeclaration = importCounts[1].importDeclaration;

        expect(importDeclaration.getModuleSpecifier()).to.equal("http");
        expect(importDeclaration.getImportSpecifiers()[0]).to.equal("Agent");
        expect(importDeclaration.isEntireModuleImported()).to.false;
    });

    it('import {Agent as MyAlias, createServer} from "http"', () => {
        const importDeclaration = importCounts[2].importDeclaration;

        expect(importDeclaration.getModuleSpecifier()).to.equal("http");
        expect(importDeclaration.getImportSpecifiers()[0]).to.equal("MyAlias");
        expect(importDeclaration.getImportSpecifiers()[1]).to.equal("createServer");
        expect(importDeclaration.isEntireModuleImported()).to.false;
    });

    it('import yargs, {Argv, check as anotherFunction} from "yargs"', () => {
        const importDeclaration = importCounts[3].importDeclaration;

        expect(importDeclaration.getModuleSpecifier()).to.equal("yargs");
        expect(importDeclaration.getImportSpecifiers()[0]).to.equal("yargs");
        expect(importDeclaration.getImportSpecifiers()[1]).to.equal("Argv");
        expect(importDeclaration.getImportSpecifiers()[2]).to.equal("anotherFunction");
        expect(importDeclaration.isEntireModuleImported()).to.false;
    });

    it('import yargs2, * as yargs3 from "yargs"', () => {
        const importDeclaration = importCounts[4].importDeclaration;

        expect(importDeclaration.getModuleSpecifier()).to.equal("yargs");
        expect(importDeclaration.getImportSpecifiers()[0]).to.equal("yargs2");
        expect(importDeclaration.getImportSpecifiers()[1]).to.equal("yargs3");
        expect(importDeclaration.isEntireModuleImported()).to.true;
    });

    it('import "path"', () => {
        const importDeclaration = importCounts[5].importDeclaration;

        expect(importDeclaration.getModuleSpecifier()).to.equal("path");
        expect(importDeclaration.getImportSpecifiers().length).to.equal(0);
    });

});