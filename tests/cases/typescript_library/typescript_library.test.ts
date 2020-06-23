import * as chai from 'chai';
import 'mocha';
import * as ts from "typescript";
import {ImportDeclaration} from "../../../src/Declarations";
import {DependencyAnalyser} from "../../../src/DependencyAnalyser";
import {Declaration, FunctionDeclaration} from "../../../src/exportDeclarations";

const expect = chai.expect;
const fileName = __dirname + "\\imports.ts";

describe('Test Imports', () => {

    let dependencyAnalyser = new DependencyAnalyser(fileName);
    dependencyAnalyser.initDtsCreator();
    dependencyAnalyser.scanAllFiles();
    let importScanner = dependencyAnalyser.importScannerMap.get(fileName);
    let typescriptImport = importScanner.importMap.get("ts");
    let memberMap = (typescriptImport as ImportDeclaration).sourceFile.getMemberMap();

    Array.from(memberMap.values()).forEach((declarationArray) => {
        declarationArray.forEach(value => {
            let name = value.constructor.name;

            switch (value.constructor.name) {
                case "InterfaceDeclaration":
                    // console.log(value.getName(), value.getMemberMap());
                    break;
                case "VariableDeclaration": // TODO: Not complete
                    // console.log(value.getName(), value.getType());
                    break;
                case "TypeAliasDeclaration":
                    // TODO: do i need them?
                    break;
                case "EnumDeclaration":
                    // console.log(value.getName(), Array.from((<EnumDeclaration>value).getEnumMembersMap().keys()));
                    break;
                case "FunctionDeclaration":
                    // console.log(value.getName() + " =>", value.getType().getName());
                    break;
                case "ClassDeclaration":
                    // console.log("ClassDeclaration", value);
                    break;
            }
        })
    });

    it('import * as myName from "./simpleExports"' , () => {
        // expect(
        //     (<ImportDeclaration>importMap.get("myName")).getModuleSpecifier()
        // ).to.equal("./simpleExports");
    });


});
