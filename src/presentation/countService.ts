import {OutputGenerator} from "./outputGenerator";
import {DependencyAnalyser} from "../main/dependencyAnalyser";
import {Options} from "../index";
import {ImportCount} from "./importCount";
import {UsageCount} from "./usageCount";

/**
 * Handles and contains all counts.
 */
export class CountService {
    get importCounts(): ImportCount[] {
        return this._importCounts;
    }

    set importCounts(value: ImportCount[]) {
        this._importCounts = value;
    }

    get usageCounts(): UsageCount[] {
        return this._usageCounts;
    }

    set usageCounts(value: UsageCount[]) {
        this._usageCounts = value;
    }

    get dependencyAnalyser(): DependencyAnalyser {
        return this._dependencyAnalyser;
    }

    set dependencyAnalyser(value: DependencyAnalyser) {
        this._dependencyAnalyser = value;
    }

    get outputGenerator(): OutputGenerator {
        return this._outputGenerator;
    }

    set outputGenerator(value: OutputGenerator) {
        this._outputGenerator = value;
    }

    private _importCounts: ImportCount[];
    private _usageCounts: UsageCount[];
    private _dependencyAnalyser: DependencyAnalyser;
    private _outputGenerator: OutputGenerator;

    constructor(dependencyAnalyser: DependencyAnalyser) {
        this.importCounts = [];
        this.usageCounts = [];
        this.dependencyAnalyser = dependencyAnalyser;
        this.outputGenerator = new OutputGenerator(this);
    }

    /**
     * Adds a UsageCount to the array.
     */
    addImportCount(importCount) {
        this.importCounts.push(importCount);
    }

    /**
     * Returns a map of ImportCounts grouped by file name as key.
     */
    groupByFileName(): Map<string, ImportCount[]> {
        return this._groupByProperty("fileName");
    }

    /**
     * Returns a map of ImportCounts grouped by module name as key.
     */
    groupByDependencyName(): Map<string, ImportCount[]> {
        return this._groupByProperty("dependencyName");
    }

    /**
     * Generic logic for grouping of ImportCounts by given property.
     * @private
     */
    private _groupByProperty(property: string) {
        const importCountsMap = new Map<string, ImportCount[]>();

        this.importCounts.forEach(value => {
            let importCountArray: ImportCount[] = importCountsMap.get(value[property]);

            if (importCountArray) {
                importCountArray.push(value);
            } else {
                importCountArray = [value];
                importCountsMap.set(value[property], importCountArray);
            }
        });

        return importCountsMap;
    }

    /**
     * Adds a UsageCount to the array.
     */
    addUsageCount(usageCount: UsageCount) {
        this.usageCounts.push(usageCount);
    }

    /**
     * Returns a map of UsageCounts grouped by file name as key.
     */
    groupUsageByFileName(): Map<string, UsageCount[]> {
        const usageCountMap = new Map<string, UsageCount[]>();

        this.usageCounts.forEach(value => {
            let usageCountArray: UsageCount[] = usageCountMap.get(value.fileName);

            if (usageCountArray) {
                usageCountArray.push(value);
            } else {
                usageCountArray = [value];
                usageCountMap.set(value.fileName, usageCountArray);
            }
        })

        return usageCountMap;
    }
}