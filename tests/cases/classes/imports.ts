import {MyClass} from "./exports"
const yargs = require("yargs");

MyClass.myStaticMethod();

{
    MyClass("hallo", 4);

    function MyClass(MyClass: string, num: number) {
    }

    MyClass("hallo", 2);
}

{
    let MyClass = "";

    MyClass += "asd";
}

{
    class MyClass {
    }

    const abc = new MyClass();
}

{
    enum MyClass { "a", "b"}

    console.log(MyClass.a);
}

const arrowFunction = (MyClass: number) => {
  return MyClass + MyClass;
};

if (2 > 3) {
    let MyClass = 123;
    MyClass = MyClass + 99;
} else {
    let MyClass = { a: "a", b: "b"};
    MyClass["a"] = MyClass.b;
}

let fnABC = function (MyClass = "a") {
    MyClass.toUpperCase();
}

// {
//     let myClass: MyClass = new MyClass();
//
//     // simple method calls
//     myClass.doSomething().doSomething().doSomething(); // count: +3
//
//     getMyClass().doSomething(); // FixMe: can't handle custom functions
//
//     // static method call
//     MyClass.myStaticMethod();  // count: +1
//
//     // simple property call
//     myClass.capsuledProperty; // count: +1
//
//     // capsuled property call
//     let myProperty2 = myClass.simpleProperty; // FIXME: can't handle declarations properly
//
//     function getMyClass(): MyClass {
//         return myClass;
//     }
// }