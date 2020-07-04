import * as chai from 'chai';
import 'mocha';

const expect = chai.expect;

describe('Dependency Analyser', () => {

    // it('init file' , () => {
    //     let dependencyAnalyser = new DependencyAnalyser(fileName);
    //     dependencyAnalyser.initDtsCreator();
    //     dependencyAnalyser.scanAllFiles();
    // });

    it('init directory', () => {
        const pug = require('pug');

        // Compile the source code
        const compiledFunction = pug.compileFile('src/presentation/templates/html/base.pug');

        // Render a set of data
        console.log(compiledFunction({
            name: 'Timothy'
        }));
    });

});