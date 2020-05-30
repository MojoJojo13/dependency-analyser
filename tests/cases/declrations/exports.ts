
/* Case 1 */

// export class MyClass {
//     simpleProperty: number;
//     private _capsuledProperty: string;
//
//     constructor() {}
//
//     doSomething = function (): MyClass {
//         return this;
//     }
//
//     static myStaticMethod = function() {
//         return "A";
//     }
//
//     get capsuledProperty(): string {
//         return this._capsuledProperty;
//     }
//
//     set capsuledProperty(value: string) {
//         this._capsuledProperty = value;
//     }
// }

/* Case 2 */

namespace Shapes {
    export class MyClass {
        simpleProperty: number;
        private _capsuledProperty: string;

        constructor() {}

        doSomething = function (): MyClass {
            return this;
        }

        static myStaticMethod = function() {
            return "A";
        }

        get capsuledProperty(): string {
            return this._capsuledProperty;
        }

        set capsuledProperty(value: string) {
            this._capsuledProperty = value;
        }
    }
}

export = Shapes;