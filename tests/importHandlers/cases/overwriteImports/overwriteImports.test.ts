import * as chai from 'chai';
import 'mocha';
import {DependencyAnalyser} from "../../../../src/main/DependencyAnalyser";
import {Options} from "../../../../src";

const expect = chai.expect;
const fileName = __dirname + "\\imports.ts";

describe('Test overwritten imports', () => {

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

    let usageCounts = dependencyAnalyser.countService.usageCounts;

    it('Should find only two usages', () => {
        expect(usageCounts.length).to.equal(2);
        expect(usageCounts[0].identifier.escapedText).to.equal("Agent");
        expect(usageCounts[1].identifier.escapedText).to.equal("get");
    });

});