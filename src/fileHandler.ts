import * as ts from "typescript";
import * as fs from "fs";

const options = {
    allowJs: true,
    declaration: true,
    emitDeclarationOnly: true,
};

export const exportsMap = new Map();

export class FileHandler {

    private _fileName: string;
    private _sourceText: ts.SourceFile;

    constructor(fileName) {
        this.fileName = fileName;
        this.createSourceFile();
        this.createDtsFile();
    }

    createSourceFile() {
        this.sourceText = ts.createSourceFile(
            this.fileName, // fileName
            fs.readFileSync(this.fileName, 'utf8'), // sourceText
            ts.ScriptTarget.Latest,
            false
        );
    }

    createDtsFile() {
        // Create a Program with an in-memory emit
        //const createdFiles = {}
        const host = ts.createCompilerHost(options);
        host.writeFile = (fileName: string, content: string) => {
            console.log("fileName", fileName);
            // console.log("content", content);

            const dtsFile = ts.createSourceFile(
                fileName,   // fileName
                content,
                ts.ScriptTarget.Latest, // languageVersion
                false
            );

        }

        // Emit the d.ts files
        console.log("this.fileName", this.fileName);
        const program = ts.createProgram([this.fileName, "C:\\Users\\Paul\\WebstormProjects\\dependency-analyser\\tests\\cases\\imports2.ts"], options, host);
        program.emit();
    }

    scanFile() {

    }

    /* GETTER & SETTER */

    get fileName(): string {
        return this._fileName;
    }

    set fileName(value: string) {
        this._fileName = value;
    }

    get sourceText(): ts.SourceFile {
        return this._sourceText;
    }

    set sourceText(value: ts.SourceFile) {
        this._sourceText = value;
    }
}