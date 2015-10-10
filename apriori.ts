'use strict';
/**
 * Apriori.js - Apriori Algorithm(http://en.wikipedia.org/wiki/Apriori_algorithm) implementation in (TypeScript|JavaScript)
 * which is based on https://github.com/asaini/Apriori/blob/master/apriori.py.
 *
 * Copyright (c) 2014 Kazuhiro Sera
 * Licensed under the MIT license: http://www.opensource.org/licenses/mit-license.php
 *
 * ----- Simple Usage -----
 * // curl https://raw.githubusercontent.com/asaini/Apriori/master/INTEGRATED-DATASET.csv -o dataset.csv
 * // node (REPL)
 * var Apriori = require('./apriori.js');
 * new Apriori.Algorithm(0.15, 0.6, false).showAnalysisResultFromFile('dataset.csv');
 * ------------------------
 */

// RequestJS declaration
declare var require: {
    (id: string): any;
    resolve(): string;
    cache: any;
    extensions: any;
};

/**
 * @namespace Apriori
 */
module Apriori {

    export class AnalysisResult {
        frequentItemSets: {[itemSetSize: number]: FrequentItemSet[]};
        associationRules: AssociationRule[];

        constructor(frequentItemSets: {[itemSetSize: number]: FrequentItemSet[]}, associationRules: AssociationRule[]) {
            this.frequentItemSets = frequentItemSets;
            this.associationRules = associationRules;
        }
    }

    export class FrequentItemSet {
        itemSet: string[];
        support: number;

        constructor(itemSet: string[], support: number) {
            this.itemSet = itemSet;
            this.support = support;
        }
    }

    export class AssociationRule {
        lhs: string[];
        rhs: string[];
        confidence: number;

        constructor(lhs: string[], rhs: string[], confidence: number) {
            this.lhs = lhs;
            this.rhs = rhs;
            this.confidence = confidence;
        }
    }

    export class Algorithm {
        minSupport: number;
        minConfidence: number;
        debugMode: boolean;

        constructor(minSupport: number, minConfidence: number, debugMode: boolean) {
            this.minSupport = minSupport ? minSupport === 0 ? 0 : minSupport : 0.15;
            this.minConfidence = minConfidence ? minConfidence === 0 ? 0 : minConfidence : 0.6;
            this.debugMode = debugMode || false;
        }

        analyze(transactions: string[][]): AnalysisResult {
            var self = this;
            var beforeMillis: number = new Date().getTime();

            var frequencies: {[strItemSet: string]: number} = {};
            var frequentItemSets: {[itemSetSize: number]: FrequentItemSet[]} = {};

            var oneElementItemSets: string[][] = self.toOneElementItemSets(transactions);
            var oneCItemSets: FrequentItemSet[] = self.findItemSetsMinSupportSatisfied(
                oneElementItemSets, transactions, self.minSupport, frequencies);
            var currentLItemSets: FrequentItemSet[] = oneCItemSets;
            var itemSetSize: number = 1;

            if (self.debugMode) {
                console.log('Before finding item sets: ' + self.getTime(beforeMillis) + ' ms');
            }
            var extractItemSet = (f: FrequentItemSet) => { return f.itemSet };
            while (currentLItemSets.length !== 0) {
                frequentItemSets[itemSetSize] = currentLItemSets;
                var joinedSets = ArrayUtils.toFixedSizeJoinedSets(currentLItemSets.map(extractItemSet), itemSetSize + 1);
                currentLItemSets = self.findItemSetsMinSupportSatisfied(joinedSets, transactions, self.minSupport, frequencies);
                itemSetSize += 1;
            }
            if (self.debugMode) {
                console.log('After finding item sets: ' + self.getTime(beforeMillis) + ' ms');
            }

            // local function which returns the support of an item
            var calculateSupport: Function = (
                    itemSet: string[], 
                    frequencies: {[strItemSet: string]: number}, 
                    transactions: string[][]): number => {
                var frequency: number = frequencies[itemSet.toString()];
                return frequency ? frequency / transactions.length : 0;
            };
            var foundSubSets: string[][] = [];
            var isTheRuleAlreadyFound: Function = (itemSet: string[]): boolean => {
                var found: boolean = false;
                foundSubSets.forEach((subset) => { if (!found) found = subset.toString() === itemSet.toString(); });
                return found;
            };

            if (self.debugMode) {
                console.log('Before calculating association rules: ' + self.getTime(beforeMillis) + ' ms');
            }
            var associationRules: AssociationRule[] = [];
            var currentItemSet: string[];
            var saveAssociationRuleIfFound = (subsetItemSet: string[]): void => {
                var diffItemSet: string[] = ArrayUtils.getDiffArray(currentItemSet, subsetItemSet);
                if (diffItemSet.length > 0) {
                    var itemSupport: number = calculateSupport(currentItemSet, frequencies, transactions),
                        subsetSupport: number = calculateSupport(subsetItemSet, frequencies, transactions),
                        confidence: number = itemSupport / subsetSupport;

                    if (!isNaN(confidence) && !isTheRuleAlreadyFound(subsetItemSet) && confidence >= self.minConfidence) {
                        foundSubSets.push(subsetItemSet);
                        associationRules.push(new Apriori.AssociationRule(subsetItemSet, diffItemSet, confidence));
                    }
                }
            };
            var saveAllAssociationRulesIfFound = (itemSet: string[]): void => {
                currentItemSet = itemSet;
                ArrayUtils.toAllSubSets(currentItemSet).forEach(saveAssociationRuleIfFound);
            };
            for (var k in frequentItemSets) {
                var itemSets: string[][] = frequentItemSets[k].map(extractItemSet);
                if (itemSets.length === 0 || itemSets[0].length <= 1) {
                    continue;
                }
                itemSets.forEach(saveAllAssociationRulesIfFound)
            }
            if (self.debugMode) {
                console.log('After calculating association rules: ' + self.getTime(beforeMillis) + ' ms');
            }

            var analysisResult = new AnalysisResult(frequentItemSets, associationRules);
            if (self.debugMode) {
                console.log('AnalysisResult: ' + JSON.stringify(analysisResult))
                console.log('Apriori.Algorithm\'s total spent time: ' + self.getTime(beforeMillis) + ' ms');
            }
            return analysisResult;
        }

        toOneElementItemSets(transactions): string[][] {
            var nestedArrayOfItem: string[][] = [];
            transactions.forEach((transaction) => {
                transaction.forEach((item: string) => { nestedArrayOfItem.push(new Array(item)); });
            });
            return ArrayUtils.toArraySet(nestedArrayOfItem);
        }

        findItemSetsMinSupportSatisfied(
            itemSets: string[][],
            transactions: string[][],
            minSupport: number,
            frequencies:{ [strItemSet: string]:  number }): FrequentItemSet[] {

            var filteredItemSets: FrequentItemSet[] = [],
                localFrequencies: {[strItemSet: string]: number} = {};

            itemSets.forEach((itemSet: string[]) => {
                transactions.forEach((transaction: string[]) => {
                    if (ArrayUtils.isSubSetArrayOf(itemSet, transaction)) {
                        if (!frequencies[itemSet.toString()]) frequencies[itemSet.toString()] = 0;
                        if (!localFrequencies[itemSet.toString()]) localFrequencies[itemSet.toString()] = 0;
                        frequencies[itemSet.toString()] += 1;
                        localFrequencies[itemSet.toString()] += 1;
                    }
                });
            });
            var alreadyAdded = false;
            var setAsAlreadyAddedIfFound = (f: FrequentItemSet): void => {
                if (!alreadyAdded) alreadyAdded = f.itemSet.toString() === itemSet.toString();
            };
            for (var strItemSet in localFrequencies) {
                var itemSet: string[] = strItemSet.split(',').sort(),
                    localCount: number = localFrequencies[itemSet.toString()],
                    support: number = localCount / transactions.length;

                if (support >= minSupport) {
                    alreadyAdded = false;
                    filteredItemSets.forEach(setAsAlreadyAddedIfFound);
                    if (! alreadyAdded) {
                        filteredItemSets.push(new FrequentItemSet(itemSet, support));
                    }
                }
            }
            return filteredItemSets;
        }

        // runs on the Node.js runtime
        showAnalysisResultFromFile(filename: string) {
            var self: Apriori.Algorithm = this;
            require('fs').readFile(filename, 'utf8', (err, data: string) => {
                if (err) throw err;
                var transactions: string[][] = ArrayUtils.readCSVToArray(data, ',');
                var analysisResult: AnalysisResult = self.analyze(transactions);
                console.log(JSON.stringify(analysisResult.associationRules));
            });
        }

        private getTime(initial: number): number {
            return new Date().getTime() - initial;
        }
    }

    // yes, reinvention of the wheel. Just for no dependency.
    export class ArrayUtils {
        static toStringSet(array: string[]): string[] {
            var uniqueArray: string[] = [];
            array.forEach((e) => {
               if (uniqueArray.indexOf(e) === -1) uniqueArray.push(e);
            });
            return uniqueArray;
        }
        static toArraySet(arrayOfArray: string[][]): string[][] {
            var foundElements: { [strArray: string]: boolean } = {},
                uniqueArray: string[][] = [];
            arrayOfArray.forEach((array) => {
                if (!foundElements.hasOwnProperty(array.toString())) {
                    uniqueArray.push(array);
                    foundElements[array.toString()] = true;
                }
            });
            return uniqueArray;
        }
        static toAllSubSets(array: string[]): string[][] {
            // refs: http://stackoverflow.com/questions/5752002/find-all-possible-subset-combos-in-an-array
            var op = (n: number, sourceArray: string[], currentArray: string[], allSubSets: string[][]) => {
                if (n === 0) {
                    if (currentArray.length > 0) {
                        allSubSets[allSubSets.length] = ArrayUtils.toStringSet(currentArray);
                    }
                } else {
                    for (var j = 0; j < sourceArray.length; j++) {
                        var nextN = n - 1,
                            nextArray = sourceArray.slice(j + 1),
                            updatedCurrentSubSet = currentArray.concat([sourceArray[j]]);
                        op(nextN, nextArray, updatedCurrentSubSet, allSubSets);
                    }
                }
            }
            var allSubSets: string[][] = [];
            array.sort();
            for (var i = 1; i < array.length; i++) {
                op(i, array, [], allSubSets);
            }
            allSubSets.push(array);
            return ArrayUtils.toArraySet(allSubSets);
        }
        static toFixedSizeJoinedSets(itemSets: string[][], length: number): string[][] {
            var joinedSetArray: string[][] = [];
            itemSets.forEach((itemSetA: string[]) => {
                itemSets.forEach((itemSetB: string[]) => {
                    if (ArrayUtils.getDiffArray(itemSetA, itemSetB).length > 0) {
                        var mergedArray = [].concat(itemSetA).concat(itemSetB),
                            joinedSet = ArrayUtils.toStringSet(mergedArray);
                        if (joinedSet.length === length) joinedSetArray.push(joinedSet);
                    }
                });
            });
            return ArrayUtils.toArraySet(joinedSetArray);
        }
        static isSubSetArrayOf(targetArray: string[], superSetArray: string[]): boolean {
            var isSubSetArray: boolean = true;
            targetArray.forEach((item: string) => {
                if (isSubSetArray && superSetArray.indexOf(item) === -1) isSubSetArray = false;
            });
            return isSubSetArray;
        }
        static getDiffArray(arrayA: string[], arrayB: string[]): string[] {
            var diffArray: string[] = [];
            arrayA.forEach((e) => { if (arrayB.indexOf(e) === -1) diffArray.push(e); });
            return diffArray;
        }
        static readCSVToArray(inputString: string, delimiter: string): string[][] {
            // ref: http://stackoverflow.com/a/1293163/2343
            delimiter = delimiter || ',';
            var regexp: RegExp = new RegExp((
                // Delimiters.
                "(\\" + delimiter + "|\\r?\\n|\\r|^)" +
                // Quoted fields.
                "(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|" +
                // Standard fields.
                "([^\"\\" + delimiter + "\\r\\n]*))"), 'gi');

            var arrayOfRows: string[][] = [[]];
            var matched: RegExpExecArray;
            while (!!(matched = regexp.exec(inputString))) {
                var matchedDelimiter: string = matched[1];
                if (matchedDelimiter.length && matchedDelimiter !== delimiter) {
                    arrayOfRows.push([]);
                }
                var matchedValue: string = matched[2] ? matched[2].replace(new RegExp('""', 'g'), '"') : matched[3];
                if (matchedValue.length > 0) {
                    arrayOfRows[arrayOfRows.length - 1].push(matchedValue);
                }
            }
            return arrayOfRows;
        }
    }
}

