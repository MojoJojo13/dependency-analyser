import {SignatureDeclaration, VariableDeclaration} from "typescript";

let numberRegexp = /^[0-9]+$/;

interface ZipCodeValidator2 {
    isAcceptable(s);
}

class ZipCodeValidator implements ZipCodeValidator2 {
    nmbRegexp = /^[0-9]+$/;

    isAcceptable(s) {
        return s.length === 5 && this.nmbRegexp.test(s);
    }
}

class ZipCodeValidator3 implements ZipCodeValidator2 {
    isAcceptable(s) {
        return s.length === 5 && numberRegexp.test(s);
    }
}

export let fnFoo, fnFoo2 = function (test: string) {
    let x = new ZipCodeValidator();
    x.isAcceptable("ab234");
}

let myZipCodeValidator = new ZipCodeValidator();

export default function testFunction1(): ZipCodeValidator3 {
    return new ZipCodeValidator3();
}

let Foo = class {
    constructor() {
    }

    bar() {
        return "Hello World!";
    }
};

namespace Shapes {
    export namespace Polygons {
        export class Triangle {
            constructor() {
            }
        }

        export class Square {
        }
    }
}

// export = Shapes;
export {Shapes};

export type MyType = SignatureDeclaration | VariableDeclaration;

export {ZipCodeValidator, ZipCodeValidator2 as Abc};
export {myZipCodeValidator, Foo};

export {FunctionTypeNode} from "typescript";
export {Node} from "typescript"; //TODO: handle this
