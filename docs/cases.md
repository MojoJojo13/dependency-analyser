# Cases

## Imports

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
[✗] import defaultExport, * as name from "module-name";
[✗] import "module-name";
[✗] var promise = import("module-name");
```

## Classes

### New Instance

```typescript
import {MyClass} from "destination"
new MyClass(); // +1
```

### Call a Class Method

```typescript
import {MyClass} from "destination"
let myClass = new MyClass(); // +1
myClass.doSomething(); // +1
```

## Functions

### Simple Function Call

```typescript
import {myFunction} from "destination"
myFunction(); // +1
```

## Variables