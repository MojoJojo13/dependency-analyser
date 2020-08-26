import {Agent, get} from "http"

/* valid usages */

let myAgent = new Agent(); // is usage

get("https://google.com"); // is usage


/* not valid usages */

{ // overwrite a variable

    let Agent = "abc"; // not a usage

    Agent += "zyz"; // not a usage
}


{ // overwrite a class

    class Agent { // overwrite Agent
        constructor(a: string) {
            console.log(a);
        }
    }

    const myAgent = new Agent("a"); // not a usage
}


{ // overwrite an enum

    enum Agent { "a", "b"} // overwrite Agent

    console.log(Agent.a); // not a usage
}


{ // overwrite a function

    function get(get: number) { // overwrite get twice
        return get * 2;
    }

    get(2); // not a usage
}


// overwrite an arrow function
const arrowFunction = (Agent: number) => { // overwrite Agent
    return Agent + Agent; // not a usage
};


// overwrite in an if/else scope
if (2 > 3) {
    let Agent = 123; // overwrite Agent
    Agent = Agent + 99; // not a usage
} else {
    let Agent = {a: "a", b: "b"}; // overwrite Agent
    Agent["a"] = Agent.b; // not a usage
}


// overwrite a parameter
let fnABC = function (Agent = "a") { // overwrite Agent
    Agent.toUpperCase(); // not a usage
}
