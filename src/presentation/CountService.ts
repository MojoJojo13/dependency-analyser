import {ImportCount} from "./Counter";
import {OutputGenerator} from "./OutputGenerator";
import {DependencyAnalyser} from "../DependencyAnalyser";

export class CountService {
    get importCounts(): ImportCount[] {
        return this._importCounts;
    }

    set importCounts(value: ImportCount[]) {
        this._importCounts = value;
    }

    private _importCounts: ImportCount[];
    dependencyAnalyser: DependencyAnalyser;

    constructor(dependencyAnalyser: DependencyAnalyser) {
        this._importCounts = [];
        this.dependencyAnalyser = dependencyAnalyser;
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

    generateOutput(path: string, outputPath: string) {
        OutputGenerator.generateHTML(this, path, outputPath, this.dependencyAnalyser.filesTree);
    }
}