import {MyClass} from "./exports"

{
    // [✓] [✗]

    // name[✓], type[✗], initializer[✓]
    const a = "a";

    // name[✓], type[✓], initializer[✗]
    let b : string;

    // name[✓], type[✓], initializer[✓]
    let c : number = 42;

    // d: name[✓], type[✗], initializer[✗]
    // e: name[✓], type[✗], initializer[✓]
    let d, e = true;

    // let f: number, g = 7;
    // let h, i: number = 9;
    // let j: string, k: string = "123";

    // l: name[✓], type[✓], initializer[✓]
    // m: name[✓], type✓], initializer[✓]
    let l: string = "abc",
        m: string = "def";

    let x, y, z;
    x = y = z = "chain";

    // let myProperty2 = myClass0.simpleProperty;

    // Classes
    let myClass0 = new MyClass(); // tracked because of the new expression
    let myClass1: MyClass = new MyClass(); // tracked because of the type
    let myClass2 = new MyClass().doSomething().doSomething(); // tracked because the return type is imported


    // Arrays [not supported yet]
    let myArray: MyClass[] = [new MyClass(), new MyClass()];
    myArray[0].doSomething();

    // typed object [not supported yet]
    let myMap: Map<string, MyClass>;


    // tuple types [not supported yet]
    let tuple: [MyClass, MyClass];

    let triple: [MyClass, MyClass, MyClass];

}