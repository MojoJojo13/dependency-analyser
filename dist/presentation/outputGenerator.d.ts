import { CountService } from "./countService";
export declare class OutputGenerator {
    get countService(): CountService;
    set countService(value: CountService);
    private _countService;
    private date;
    constructor(countService: CountService);
    /**
     * Creates all HTML files for output.
     */
    generateHTML(): void;
    /**
     * Creates all missing folders of a given path on the file system.
     */
    private createFolder;
    /**
     * Creates all folders to the target directory. Used to be deleting all
     * content of the folder.
     */
    private cleanRootFolder;
    /**
     * Creates a HTML file with given content on the file system.
     */
    private createHtmlFile;
    /**
     * Copies all marked templates to the target directory on the file system.
     */
    private createAssets;
    /**
     * Creates the content of the index file.
     */
    private generateIndex;
    /**
     * Creates the content of the modules files.
     */
    private generateModules;
    /**
     * Creates the content of the code files.
     */
    private generateFileContent;
}
