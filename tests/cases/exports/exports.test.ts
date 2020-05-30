import * as ts from "typescript";
import * as fs from "fs";
import * as chai from 'chai';
import 'mocha';
import {SourceFile} from "../../../src/exportDeclarations";

const expect = chai.expect;
const fileName = "C:\\Users\\Paul\\WebstormProjects\\dependency-analyser\\dist\\tests\\cases\\exports\\exports.d.ts";
// const fileName = "C:\\Users\\Paul\\WebstormProjects\\dependency-analyser\\dist\\tests\\cases\\exports\\exports.d.ts";

describe('My math library 1', () => {

    const sourceFileTs = ts.createSourceFile(
        fileName, // fileName
        fs.readFileSync(fileName, 'utf8'), // sourceText
        ts.ScriptTarget.Latest, // languageVersion
    );

    let sourceFile = new SourceFile(sourceFileTs);

    it('should be able to add things correctly' , () => {
        let memberMap = sourceFile.getMemberMap().get("MyClass")[0].getMemberMap();
        console.log("memberMap", memberMap);

        // expect(add(3,4)).to.equal(7);
    });

    it('should be able to add things correctly' , () => {
        let countMemberMap = sourceFile.getCountMemberMap();
        console.log("countMemberMap", countMemberMap);

        // expect(add(3,4)).to.equal(7);
    });

});