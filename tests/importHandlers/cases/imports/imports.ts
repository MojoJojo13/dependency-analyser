// import * as name from "module-name";
import * as ts from "typescript"

// import { export1 } from "module-name";
import {Agent} from "http"

// import { export1 as alias1 } from "module-name";
// import { export1 , export2 } from "module-name";
// import { foo , bar } from "module-name/path/to/specific/un-exported/file";
// import { export1 , export2 as alias2 , [...] } from "module-name";
import {Agent as MyAlias, createServer} from "http"

// import defaultExport from "module-name";
// import defaultExport, { export1 [ , [...] ] } from "module-name";
import yargs, {Argv, check as anotherFunction} from "yargs"

// import defaultExport, * as name from "module-name";
import yargs2, * as yargs3 from "yargs"

// import "module-name";
import "path"

var promise = import("os");