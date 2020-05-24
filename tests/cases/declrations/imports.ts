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
    let l: string = "abc", m: string = "def";

    // WTF? not supported
    let [n, o]:number[] = [1, 2];

    let x, y, z;
    x = y = z = "chain";

    let myClass0 = new MyClass(); // tracked because of the new expression
    let myClass1: MyClass = new MyClass(); // tracked because of the type
    let myClass2 = new MyClass().doSomething().doSomething(); // tracked because the return type is imported

    let myProperty2 = myClass0.simpleProperty;

    let myArray: MyClass[] = [new MyClass(), new MyClass()];
}