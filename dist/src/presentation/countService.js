"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CountService = void 0;
const outputGenerator_1 = require("./outputGenerator");
/**
 * Handles and contains all counts.
 */
class CountService {
    constructor(dependencyAnalyser) {
        this.importCounts = [];
        this.usageCounts = [];
        this.dependencyAnalyser = dependencyAnalyser;
        this.outputGenerator = new outputGenerator_1.OutputGenerator(this);
    }
    get importCounts() {
        return this._importCounts;
    }
    set importCounts(value) {
        this._importCounts = value;
    }
    get usageCounts() {
        return this._usageCounts;
    }
    set usageCounts(value) {
        this._usageCounts = value;
    }
    get dependencyAnalyser() {
        return this._dependencyAnalyser;
    }
    set dependencyAnalyser(value) {
        this._dependencyAnalyser = value;
    }
    get outputGenerator() {
        return this._outputGenerator;
    }
    set outputGenerator(value) {
        this._outputGenerator = value;
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
    groupByFileName() {
        return this._groupByProperty("fileName");
    }
    /**
     * Returns a map of ImportCounts grouped by module name as key.
     */
    groupByDependencyName() {
        return this._groupByProperty("dependencyName");
    }
    /**
     * Generic logic for grouping of ImportCounts by given property.
     * @private
     */
    _groupByProperty(property) {
        const importCountsMap = new Map();
        this.importCounts.forEach(value => {
            let importCountArray = importCountsMap.get(value[property]);
            if (importCountArray) {
                importCountArray.push(value);
            }
            else {
                importCountArray = [value];
                importCountsMap.set(value[property], importCountArray);
            }
        });
        return importCountsMap;
    }
    /**
     * Adds a UsageCount to the array.
     */
    addUsageCount(usageCount) {
        this.usageCounts.push(usageCount);
    }
    /**
     * Returns a map of UsageCounts grouped by file name as key.
     */
    groupUsageByFileName() {
        const usageCountMap = new Map();
        this.usageCounts.forEach(value => {
            let usageCountArray = usageCountMap.get(value.fileName);
            if (usageCountArray) {
                usageCountArray.push(value);
            }
            else {
                usageCountArray = [value];
                usageCountMap.set(value.fileName, usageCountArray);
            }
        });
        return usageCountMap;
    }
}
exports.CountService = CountService;
//# sourceMappingURL=countService.js.map