import {MyClass} from "./exports"

{
    let myClass: MyClass = new MyClass();

    // simple method call
    myClass.doSomething().doSomething().doSomething();

    // static method call
    MyClass.myStaticMethod();
}