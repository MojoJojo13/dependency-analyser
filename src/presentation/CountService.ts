import {ImportCount, UsageCount} from "./Counter";
import {OutputGenerator} from "./OutputGenerator";
import {DependencyAnalyser} from "../DependencyAnalyser";
import {Options} from "../index";

export class CountService {

    get importCounts(): ImportCount[] {
        return this._importCounts;
    }

    set importCounts(value: ImportCount[]) {
        this._importCounts = value;
    }

    private _importCounts: ImportCount[];
    usageCounts: UsageCount[];

    dependencyAnalyser: DependencyAnalyser;
    outputGenerator: OutputGenerator;

    constructor(dependencyAnalyser: DependencyAnalyser) {
        this._importCounts = [];
        this.usageCounts = [];
        this.dependencyAnalyser = dependencyAnalyser;
        this.outputGenerator = new OutputGenerator(this);
    }

    addImportCount(importCount) {
        this.importCounts.push(importCount);
    }

    groupByFileName(): Map<string, ImportCount[]> {
        return this._groupByProperty("fileName");
    }

    groupByDependencyName(): Map<string, ImportCount[]> {
        return this._groupByProperty("dependencyName");
    }

    _groupByProperty(property: string) {
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

    addUsageCount(usageCount: UsageCount) {
        this.usageCounts.push(usageCount);
    }

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