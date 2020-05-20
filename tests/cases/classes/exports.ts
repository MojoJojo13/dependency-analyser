export class MyClass {
    constructor() {}

    doSomething = function (): MyClass {
        return this;
    }

    static myStaticMethod = function() {
        return "A";
    }
}