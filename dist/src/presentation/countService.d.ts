import { OutputGenerator } from "./outputGenerator";
import { DependencyAnalyser } from "../main/dependencyAnalyser";
import { ImportCount } from "./importCount";
import { UsageCount } from "./usageCount";
/**
 * Handles and contains all counts.
 */
export declare class CountService {
    get importCounts(): ImportCount[];
    set importCounts(value: ImportCount[]);
    get usageCounts(): UsageCount[];
    set usageCounts(value: UsageCount[]);
    get dependencyAnalyser(): DependencyAnalyser;
    set dependencyAnalyser(value: DependencyAnalyser);
    get outputGenerator(): OutputGenerator;
    set outputGenerator(value: OutputGenerator);
    private _importCounts;
    private _usageCounts;
    private _dependencyAnalyser;
    private _outputGenerator;
    constructor(dependencyAnalyser: DependencyAnalyser);
    /**
     * Adds a UsageCount to the array.
     */
    addImportCount(importCount: any): void;
    /**
     * Returns a map of ImportCounts grouped by file name as key.
     */
    groupByFileName(): Map<string, ImportCount[]>;
    /**
     * Returns a map of ImportCounts grouped by module name as key.
     */
    groupByDependencyName(): Map<string, ImportCount[]>;
    /**
     * Generic logic for grouping of ImportCounts by given property.
     * @private
     */
    private _groupByProperty;
    /**
     * Adds a UsageCount to the array.
     */
    addUsageCount(usageCount: UsageCount): void;
    /**
     * Returns a map of UsageCounts grouped by file name as key.
     */
    groupUsageByFileName(): Map<string, UsageCount[]>;
}
