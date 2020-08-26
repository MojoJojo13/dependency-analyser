import { ImportScanner } from "../importHandlers/importService";
import { CountService } from "../presentation/countService";
import { Options } from "../index";
/**
 * Root controller for this application.
 */
export declare class DependencyAnalyser {
    get allFiles(): string[];
    set allFiles(value: string[]);
    get filesObject(): object;
    set filesObject(value: object);
    get importScannerMap(): Map<string, ImportScanner>;
    set importScannerMap(value: Map<string, ImportScanner>);
    get countService(): CountService;
    set countService(value: CountService);
    get options(): Options;
    set options(value: Options);
    get packageJson(): object;
    set packageJson(value: object);
    private _allFiles;
    private _filesObject;
    private _importScannerMap;
    private _countService;
    private _options;
    private _packageJson;
    constructor(options: Options);
    /**
     * Scans the given given directory path and returns an object
     * with all filtered Files as array and as an object tree.
     * @param scanDir Path to a File or Directory to be scanned
     */
    getAllFiles(scanDir: string): {
        filesArray: any;
        filesObject: any;
    };
    /**
     * Scans all found files with ImportScanner
     */
    scanAllFiles(): void;
    /**
     * @link OutputGenerator#generateHTML
     */
    generateOutput(): void;
}
