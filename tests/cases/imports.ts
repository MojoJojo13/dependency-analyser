import {ZipCodeValidator, Abc, fnFoo, myZipCodeValidator, Foo} from "./exports";
import {SecondFileStuff} from "./exports2";
import * as ts from "typescript";
import {Shapes} from "./exports";

// import polygons = Shapes.Polygons;
// new polygons.Square();

let zcv1, zcv2: ZipCodeValidator = abc(new ZipCodeValidator());

zcv1.isAcceptable("asd");
zcv2.isAcceptable("234");

let x = ts.isTypeNode(undefined);

let f, b = new Foo();
f.bar();
b.bar().toString();

let xy = new SecondFileStuff();

myZipCodeValidator.isAcceptable("asdfg");

let myValidator = new ZipCodeValidator();
let xd = myValidator.isAcceptable("12345").toString();

console.log("isAcceptable", x);

export function abc(zcv: ZipCodeValidator): ZipCodeValidator {
    return zcv;
}