import * as ts from "typescript";
import {ImportScanner} from "../../../src/importService";
import * as chai from 'chai';
import 'mocha';

const expect = chai.expect;

const sourceText =
    "import {MyClass} from \"./exports\"\n" +
    "let myClass = new MyClass();\n" +
    "myClass.doSomething();";

const sourceFile = ts.createSourceFile(
    'simpleImport.ts', // fileName
    sourceText, // sourceText
    ts.ScriptTarget.Latest, // languageVersion
    false
);

describe('My math library 1', () => {

    it('should be able to add things correctly' , () => {
        //expect().to.equal(7);
        new ImportScanner(sourceFile).surfaceCountWrapper();
    });

});