// import * as name from "module-name";
import * as myName from "./simpleExports"

// import { export1 } from "module-name";
import {MyClass} from "./simpleExports"

// import { export1 as alias1 } from "module-name";
// import { export1 , export2 } from "module-name";
// import { foo , bar } from "module-name/path/to/specific/un-exported/file";
// import { export1 , export2 as alias2 , [...] } from "module-name";
import {MyClass as MyAlias, myFunction} from "./simpleExports"

// import defaultExport from "module-name";
// import defaultExport, { export1 [ , [...] ] } from "module-name";
import MyDefaultClass, {anotherClass, aFunction as anotherFunction} from "./defaultExport"

// import defaultExport, * as name from "module-name";


// import "module-name";
import "./simpleExports"

// var promise = import("module-name");