import ts = require("typescript");
import {ExportSpecifier} from "typescript";

class ExportDeclaration {
    node: ts.ExportDeclaration;

    constructor(node) {
        this.node = node;
    }

    getExportSpecifierNames() {
        let ret: string[] = [];

        if (this.node.exportClause.kind === 261 /* NamedExports */) {
            let namedExports = <ts.NamedExports> this.node.exportClause;
            namedExports.elements.forEach(function (value: ts.ExportSpecifier) {

                if (value.propertyName && value.name){
                    ret.push(value.propertyName.escapedText.toString());
                } else if (value.name) {
                    ret.push(value.name.escapedText.toString());
                }
                // console.log("value", value);
            });
        } else if (this.node.exportClause.kind === 262 /* NamespaceExport */) {
            let namespaceExport = <ts.NamespaceExport> this.node.exportClause;
            console.log("namespaceExport", namespaceExport);
        } else {
            console.log("Can't handle this 0");
        }

        return ret;
    }

    setNode(node: ts.ExportDeclaration) {
        this.node = node;
    }

    getNode() {
        return this.node;
    }
}

export {ExportDeclaration}