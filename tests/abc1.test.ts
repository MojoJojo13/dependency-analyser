import {add} from "../src";
import * as chai from 'chai';
import 'mocha';

const expect = chai.expect;
describe('My math library 1', () => {

    it('should be able to add things correctly' , () => {
        expect(add(3,4)).to.equal(7);
    });

});