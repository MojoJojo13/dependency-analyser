import * as ts from "typescript";
import {printChildren} from "./util";

export abstract class Declaration {

    private _node: ts.Node;
    private _alias: string;

    constructor(node: ts.Node) {
        this.node = node;
    }

    getMemberMap(): Map<string, Declaration[]> {
        console.log("this.node", this.node);
        return new Map<string, Declaration[]>();
    }

    getName(): string {
        return getNodeName(this.node);
    }

    getType(): Type {
        return this.node["type"] ? new Type(this.node["type"]) : undefined;
    }

    getCountMemberMap(): Map<string, number> {
        let countMap = new Map<string, number>();

        Array.from(this.getMemberMap().values()).forEach(member => {
            member.forEach(declaration => {
                let name = declaration.constructor.name;
                countMap.set(name, countMap.get(name) + 1 || 1);
            })

        })

        return countMap;
    }

    /*
        GETTER & SETTER
     */

    get node(): ts.Node {
        return this._node;
    }

    set node(value: ts.Node) {
        this._node = value;
    }

    get alias(): string {
        return this._alias;
    }

    set alias(value: string) {
        this._alias = value;
    }
}

export class SourceFile extends Declaration {

    constructor(node: ts.Node) {
        super(node);
        // printChildren(node);
    }

    getMemberMap(): Map<string, Declaration[]> {
        let memberMap: Map<string, Declaration[]> = new Map<string, Declaration[]>();

        this.node.forEachChild(child => {
            handleNode(child, memberMap);
        });

        return memberMap;
    }

}

export class ClassDeclaration extends Declaration {

    node: ts.ClassDeclaration;

    getMemberMap(): Map<string, Declaration[]> {
        let memberMap: Map<string, Declaration[]> = new Map<string, Declaration[]>();

        this.node.members.forEach(member => {
            handleNode(member, memberMap);
        });

        return memberMap;
    }
}

export class ModuleDeclaration extends Declaration {

    node: ts.ModuleDeclaration;

    getMemberMap(): Map<string, Declaration[]> {
        let memberMap: Map<string, Declaration[]> = new Map<string, Declaration[]>();
        let body = this.node.body;

        if (ts.isModuleBlock(body)) {
            // console.log("this.node", ();

            (<ts.ModuleBlock>body).statements.forEach(statement => {
                handleNode(statement, memberMap);
            })

        } else if (ts.isModuleDeclaration(body)) {

            //TODO: handle this
            set(memberMap, getNodeName(body), new ModuleDeclaration(body));

        } else {
            console.error(body);
            throw `it's not a ModuleBLock: ${ts.SyntaxKind[body.kind]} (${body.kind})`;
        }

        return memberMap;
    }

}

export class InterfaceDeclaration extends Declaration {
    node: ts.InterfaceDeclaration;

    getMemberMap(): Map<string, Declaration[]> {
        let memberMap: Map<string, Declaration[]> = new Map<string, Declaration[]>();

        this.node.members.forEach(member => {
            handleNode(member, memberMap);
        });

        return memberMap;
    }

}

export class TypeAliasDeclaration extends Declaration {
    node: ts.TypeAliasDeclaration;
}

export class EnumDeclaration extends Declaration {

    node: ts.EnumDeclaration;

    getEnumMembersMap(): Map<string, EnumMember> {
        let enumMap: Map<string, EnumMember> = new Map<string, EnumMember>();

        this.node.members.forEach(member => {
            enumMap.set(getNodeName(member), new EnumMember(member));
        })

        return enumMap;
    }
}

export class EnumMember extends Declaration {

}

export class FunctionDeclaration extends Declaration {
}

export class MethodDeclaration extends Declaration {
}

export class PropertyDeclaration extends Declaration {
}

export class Constructor extends Declaration {
}

export class GetAccessor extends Declaration {
}

export class SetAccessor extends Declaration {
}

export class VariableDeclaration extends Declaration {
    node: ts.VariableDeclaration;

    // getType(): string {
    //
    //     // console.log(this.node);
    //
    //     if (this.node.type) { // FixMe: Why is this broken?
    //         // let typeNode = <ts.TypeNode> this.node.type;
    //         //
    //         // if (typeNode.kind === ts.SyntaxKind.TypeReference) {
    //         //     // @ts-ignore //FixMe
    //         //     return getNodeName(typeNode.typeName);
    //         // }
    //     } else if (this.node.initializer) {
    //         // console.log(this.node.initializer);
    //         if (this.node.initializer.kind === ts.SyntaxKind.StringLiteral) {
    //             return "STRINGLITERAL";
    //         }
    //     }
    //
    //     return;
    // }
}

export class PropertySignature extends Declaration {
}

export class MethodSignature extends Declaration {
}

export class Type extends Declaration {
    // TODO: node: ts.TYPE

    getName(): string { // HANDLE T and U stuff
        if (this.node["typeName"]) {
            return this.node["typeName"].escapedText.toString();
        } else if (this.node["types"]) {
            return this.node["types"].map(value => new Type(value).getName());
        } else if (this.node["members"]) { // TODO: this is not what it seems to be
            // return this.node["members"].map(value => new Type(value).getName());
        } else if (this.node["elementType"]) {
            return new Type(this.node["elementType"]).getName();
        } else if (this.node["type"] && this.node["type"]["elementType"]) {
            return new Type(this.node["type"]["elementType"]).getName();
        } else if (this.node["parameterName"]) {
            console.log("this.node", this.node);
            // TODO: handle advanced types?
            // https://www.typescriptlang.org/docs/handbook/advanced-types.html
            return "### NOT HANDLED RIGHT NOW ###"
        } else {
            switch (this.node["kind"]) {
                case ts.SyntaxKind.VoidKeyword:
                    return "ts.SyntaxKind.VoidKeyword";
                case ts.SyntaxKind.AnyKeyword:
                    return "ts.SyntaxKind.AnyKeyword";
                case ts.SyntaxKind.BooleanKeyword:
                    return "ts.SyntaxKind.BooleanKeyword";
                case ts.SyntaxKind.NumberKeyword:
                    return "ts.SyntaxKind.NumberKeyword";
                case ts.SyntaxKind.ObjectKeyword:
                    return "ts.SyntaxKind.ObjectKeyword";
                case ts.SyntaxKind.StringKeyword:
                    return "ts.SyntaxKind.StringKeyword";
                case ts.SyntaxKind.UndefinedKeyword:
                    return "ts.SyntaxKind.UndefinedKeyword";
                default:
                    console.log("this.node", this.node);
                    break;
            }

        }

        return "";
    }

}

/*
    UTIL
 */

function _getMemberMap(node: ts.InterfaceDeclaration | ts.ClassDeclaration) {
    let membersMap = new Map<string, Declaration[]>();

    if (!node.members) {
        console.error("No members found!");
        return;
    }

    node.members.forEach(value => {
        // console.log("value", value);
        switch (value.kind) {
            // case ts.SyntaxKind.MethodSignature:
            //     membersMap.set(value.name.escapedText, new MethodSignature(value));
            //     break;
            // case ts.SyntaxKind.MethodDeclaration:
            //     membersMap.set(value.name.escapedText, new MethodDeclaration(value));
            //     break;
            // case ts.SyntaxKind.PropertyDeclaration:
            //     membersMap.set(value.name.escapedText, new PropertyDeclaration(value));
            //     break;
            // case ts.SyntaxKind.Constructor:
            //     membersMap.set("constructor", new Constructor(value));
            //     break;
            // case ts.SyntaxKind.GetAccessor:
            //     membersMap.set(value.name.escapedText, new GetAccessor(value));
            //     break;
            // case ts.SyntaxKind.SetAccessor:
            //     membersMap.set(value.name.escapedText, new SetAccessor(value));
            //     break;
            default:
                console.error(value);
                throw `unknown SyntaxKind: ${ts.SyntaxKind[value.kind]} (${value.kind})`;

        }
    });

    return membersMap;
}

function handleNode(node: ts.Node, memberMap: Map<string, Declaration[]>) {
    switch (node.kind) {
        case ts.SyntaxKind.InterfaceDeclaration:
            set(memberMap, getNodeName(node), new InterfaceDeclaration(node));
            break;

        case ts.SyntaxKind.ClassDeclaration:
            set(memberMap, getNodeName(node), new ClassDeclaration(node));
            break;

        case ts.SyntaxKind.TypeAliasDeclaration:
            set(memberMap, getNodeName(node), new TypeAliasDeclaration(node));
            break;

        case ts.SyntaxKind.EnumDeclaration:
            set(memberMap, getNodeName(node), new EnumDeclaration(node));
            break;

        case ts.SyntaxKind.Constructor:
            set(memberMap, "constructor", new Constructor(node));
            break;

        case ts.SyntaxKind.FunctionDeclaration:
            set(memberMap, getNodeName(node), new FunctionDeclaration(node));
            break;

        case ts.SyntaxKind.PropertyDeclaration:
            set(memberMap, getNodeName(node), new PropertyDeclaration(node));
            break;

        case ts.SyntaxKind.GetAccessor:
            set(memberMap, getNodeName(node), new GetAccessor(node));
            break;

        case ts.SyntaxKind.SetAccessor:
            set(memberMap, getNodeName(node), new SetAccessor(node));
            break;

        case ts.SyntaxKind.ModuleDeclaration:
            set(memberMap, getNodeName(node), new ModuleDeclaration(node));
            break;

        case ts.SyntaxKind.PropertySignature:
            set(memberMap, getNodeName(node), new PropertySignature(node));
            break;

        case ts.SyntaxKind.MethodSignature:
            set(memberMap, getNodeName(node), new MethodSignature(node));
            break;

        case ts.SyntaxKind.FirstStatement:

            if (ts.isVariableStatement(node)) {
                let declarationList = node.declarationList;

                declarationList.declarations.forEach(variableDeclaration => {
                    set(memberMap, getNodeName(variableDeclaration), new VariableDeclaration(variableDeclaration));
                });

            }

            break;

        //handle later
        case ts.SyntaxKind.IndexSignature:

            break;

        // ignore
        case ts.SyntaxKind.EndOfFileToken:
        case ts.SyntaxKind.ExportAssignment:
        case ts.SyntaxKind.ExportDeclaration:
            break;

        default:
            console.error(node);
            throw `Unhandled SyntaxKind: ${ts.SyntaxKind[node.kind]} (${node.kind})`;
    }
}

function getNodeName(node: ts.Node): string {
    type NamedNode = ts.ClassDeclaration | ts.NamespaceDeclaration; //TODO: insert all types

    let nameString: string;
    let name = (node as NamedNode).name;

    if (ts.isIdentifier(name)) {
        nameString = name.escapedText.toString();
    } else if (ts.isStringLiteral(name)) {
        nameString = (name as ts.StringLiteral).text;
    } else {
        console.error(name);
        throw "name is neither an Identifier nor a StringLiteral";
    }

    if (!nameString) {
        console.error(node);
        throw "Node doesn't have a name!";
    }

    return nameString;
}

function set(memberMap: Map<string, Declaration[]>, key: string, value: Declaration): Map<string, Declaration[]> {
    let declaration = memberMap.get(key);

    if (Array.isArray(declaration)) {
        declaration.push(value);
    } else {
        memberMap.set(key, [value]);
    }

    return memberMap;
}