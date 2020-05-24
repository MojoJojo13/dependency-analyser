import {MyClass} from "./exports"

{
    let myClass: MyClass = new MyClass();

    // simple method calls
    myClass.doSomething().doSomething().doSomething(); // count: +3

    getMyClass().doSomething(); // FixMe: can't handle custom functions

    // static method call
    MyClass.myStaticMethod();  // count: +1

    // simple property call
    myClass.capsuledProperty; // count: +1

    // capsuled property call
    let myProperty2 = myClass.simpleProperty; // FIXME: can't handle declarations properly

    function getMyClass(): MyClass {
        return myClass;
    }
}