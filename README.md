#dependency-analyser
Scan your Typescript project for imported and used dependencies and create a statistic as HTML output.

Statistics about imported dependencies and used node.js modules:
![Overview Screenshot](./docs/assets/overview.png)

File tree of imported modules:
![Module Screenshot](./docs/assets/module.png)

Code with a highlighting of import usages:
![Code Screenshot](./docs/assets/code.png)

## Supported imports
https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/import
```typescript
[✓] import defaultExport from "module-name";
[✓] import * as name from "module-name";
[✓] import { export1 } from "module-name";
[✓] import { export1 as alias1 } from "module-name";
[✓] import { export1 , export2 } from "module-name"; 
[✓] import { foo , bar } from "module-name/path/to/specific/un-exported/file";
[✓] import { export1 , export2 as alias2 , [...] } from "module-name";
[✓] import defaultExport, { export1 [ , [...] ] } from "module-name";
[✓] import defaultExport, * as name from "module-name";
[✓] import "module-name";  // marked as import, but no highlighting of usages
[✗] var promise = import("module-name");
```
```typescript
const module = require("module"); // is not supported
```

##Installing
```bash
npm install dependency-analyser
```

##Usage
```bash
dependency-analyser [options]

Options:
  --version   Show version number                                      [boolean]
  --root, -r  Root directory of your project.                           [string]
  --scan, -s  Directory to scan. (absolute or relative to root)         [string]
  --tar, -t   Target directory to put generated files into. (absolute or
              relative to root)                                         [string]
  -h, --help  Show help                                                [boolean]
```

##Examples
```bash
dependency-analyser --root C:/User/Projects/your_project

dependency-analyser --root C:/User/Projects/your_project
    --scan C:/User/Projects/your_project/src
    --tar "dep analysis"
```