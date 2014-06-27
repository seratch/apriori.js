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
        frequentItemSets: {[itemSetSize: number]: Array<FrequentItemSet>};
        associationRules: Array<AssociationRule>;

        constructor(frequentItemSets: {[itemSetSize: number]: Array<FrequentItemSet>}, associationRules: Array<AssociationRule>) {
            this.frequentItemSets = frequentItemSets;
            this.associationRules = associationRules;
        }
    }

    export class FrequentItemSet {
        itemSet: Array<string>;
        support: number;

        constructor(itemSet: Array<string>, support: number) {
            this.itemSet = itemSet;
            this.support = support;
        }
    }

    export class AssociationRule {
        lhs: Array<string>;
        rhs: Array<string>;
        confidence: number;

        constructor(lhs: Array<string>, rhs: Array<string>, confidence: number) {
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
            this.minSupport = minSupport || 0.15;
            this.minConfidence = minConfidence || 0.6;
            this.debugMode = debugMode || false;
        }

        analyze(transactions: Array<Array<string>>): AnalysisResult {
            var self = this;
            var beforeMillis: number = new Date().getTime();

            var frequencies: {[strItemSet: string]: number} = {};
            var frequentItemSets: {[itemSetSize: number]: Array<FrequentItemSet>} = {};

            var oneElementItemSets: Array<Array<string>> = self.toOneElementItemSets(transactions);
            var oneCItemSets: Array<FrequentItemSet> = self.findItemSetsMinSupportSatisfied(oneElementItemSets, transactions, self.minSupport, frequencies);
            var currentLItemSets: Array<FrequentItemSet> = oneCItemSets;
            var itemSetSize: number = 1;

            if (self.debugMode) {
                console.log('Before finding item sets: ' + self.getTime(beforeMillis) + ' ms');
            }
            while (currentLItemSets.length != 0) {
                frequentItemSets[itemSetSize] = currentLItemSets;
                var itemSets = currentLItemSets.map(function(c) { return c.itemSet; });
                var joinedSets = ArrayUtils.toFixedSizeJoinedSets(itemSets, itemSetSize + 1);
                currentLItemSets = self.findItemSetsMinSupportSatisfied(joinedSets, transactions, self.minSupport, frequencies);
                itemSetSize += 1;
            }
            if (self.debugMode) {
                console.log('After finding item sets: ' + self.getTime(beforeMillis) + ' ms');
            }

            // local function which returns the support of an item
            var calculateSupport: Function = function (
                itemSet: Array<string>, frequencies: {[strItemSet: string]: number}, transactions: Array<Array<string>>): number {
                var frequency: number = frequencies[itemSet.toString()];
                return frequency ? frequency / transactions.length : 0;
            };
            var foundSubSets: Array<Array<string>> = [];
            var isTheRuleAlreadyFound: Function = function (itemSet: Array<string>) {
                var found: boolean = false;
                foundSubSets.forEach(function (subset) { if (!found) found = subset.toString() === itemSet.toString(); });
                return found;
            };

            if (self.debugMode) {
                console.log('Before calculating association rules: ' + self.getTime(beforeMillis) + ' ms');
            }
            var associationRules: Array<AssociationRule> = [];
            for (var k in frequentItemSets) {
                var itemSets: Array<Array<string>> = frequentItemSets[k].map(function(e) { return e.itemSet; });
                if (itemSets.length === 0 || itemSets[0].length <= 1) {
                    continue;
                }
                itemSets.forEach(function (itemSet: Array<string>) {
                    ArrayUtils.toAllSubSets(itemSet).forEach(function (subsetItemSet: Array<string>) {
                        var diffItemSet = ArrayUtils.getDiffArray(itemSet, subsetItemSet);
                        if (diffItemSet.length > 0) {
                            var itemSupport: number = calculateSupport(itemSet, frequencies, transactions),
                                subsetSupport: number = calculateSupport(subsetItemSet, frequencies, transactions),
                                confidence: number = itemSupport / subsetSupport;

                            if (!isNaN(confidence) && !isTheRuleAlreadyFound(subsetItemSet) && confidence >= self.minConfidence) {
                                foundSubSets.push(subsetItemSet);
                                associationRules.push(new Apriori.AssociationRule(subsetItemSet, diffItemSet, confidence));
                            }
                        }
                    });
                })
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

        toOneElementItemSets(transactions): Array<Array<string>> {
            var nestedArrayOfItem: Array<Array<string>> = [];
            transactions.forEach(function (transaction) {
                transaction.forEach(function (item: string) { nestedArrayOfItem.push(new Array(item)); });
            });
            return ArrayUtils.toArraySet(nestedArrayOfItem);
        }

        findItemSetsMinSupportSatisfied(
            itemSets: Array<Array<string>>,
            transactions: Array<Array<string>>,
            minSupport: number,
            frequencies:{ [strItemSet: string]:  number }): Array<FrequentItemSet> {

            var filteredItemSets: Array<FrequentItemSet> = [],
                localFrequencies: {[strItemSet: string]: number} = {};

            itemSets.forEach(function (itemSet: Array<string>) {
                transactions.forEach(function (transaction: Array<string>) {
                    if (ArrayUtils.isSubSetArrayOf(itemSet, transaction)) {
                        if (!frequencies[itemSet.toString()]) frequencies[itemSet.toString()] = 0;
                        if (!localFrequencies[itemSet.toString()]) localFrequencies[itemSet.toString()] = 0;
                        frequencies[itemSet.toString()] += 1;
                        localFrequencies[itemSet.toString()] += 1;
                    }
                });
            });
            for (var strItemSet in localFrequencies) {
                var itemSet: Array<string> = strItemSet.split(',').sort(),
                    localCount: number = localFrequencies[itemSet.toString()],
                    support: number = localCount / transactions.length;

                if (support >= minSupport) {
                    var alreadyAdded = false;
                    filteredItemSets.forEach(function (f: FrequentItemSet) {
                        if (!alreadyAdded) alreadyAdded = f.itemSet === itemSet;
                    });
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
            require('fs').readFile(filename, 'utf8', function (err, data: string) {
                if (err) throw err;
                var transactions: Array<Array<string>> = ArrayUtils.readCSVToArray(data, ',');
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
        static toStringSet(array: Array<string>): Array<string> {
            var uniqueArray: Array<string> = [];
            array.forEach(function (e) {
               if (uniqueArray.indexOf(e) === -1) uniqueArray.push(e);
            });
            return uniqueArray;
        }
        static toArraySet(arrayOfArray: Array<Array<string>>): Array<Array<string>> {
            var foundElements: { [strArray: string]: boolean } = {},
                uniqueArray: Array<Array<string>> = [];
            arrayOfArray.forEach(function (array) {
                if (!foundElements.hasOwnProperty(array.toString())) {
                    uniqueArray.push(array);
                    foundElements[array.toString()] = true;
                }
            });
            return uniqueArray;
        }
        static toAllSubSets(array: Array<string>): Array<Array<string>> {
            // refs: http://stackoverflow.com/questions/5752002/find-all-possible-subset-combos-in-an-array
            var op = function (n: number, sourceArray: Array<string>, currentArray: Array<string>, allSubSets: Array<Array<string>>) {
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
            var allSubSets: Array<Array<string>> = [];
            array.sort();
            for (var i = 1; i < array.length; i++) {
                op(i, array, [], allSubSets);
            }
            allSubSets.push(array);
            return ArrayUtils.toArraySet(allSubSets);
        }
        static toFixedSizeJoinedSets(itemSets: Array<Array<string>>, length: number): Array<Array<string>> {
            var joinedSetArray: Array<Array<string>> = [];
            itemSets.forEach(function (itemSetA: Array<string>) {
                itemSets.forEach(function (itemSetB: Array<string>) {
                    if (ArrayUtils.getDiffArray(itemSetA, itemSetB).length > 0) {
                        var mergedArray = [].concat(itemSetA).concat(itemSetB),
                            joinedSet = ArrayUtils.toStringSet(mergedArray);
                        if (joinedSet.length === length) joinedSetArray.push(joinedSet);
                    }
                });
            });
            return ArrayUtils.toArraySet(joinedSetArray);
        }
        static isSubSetArrayOf(targetArray: Array<string>, superSetArray: Array<string>): boolean {
            var isSubSetArray: boolean = true;
            targetArray.forEach(function (item: string) {
                if (isSubSetArray && superSetArray.indexOf(item) === -1) isSubSetArray = false;
            });
            return isSubSetArray;
        }
        static getDiffArray(arrayA: Array<string>, arrayB: Array<string>): Array<string> {
            var diffArray: Array<string> = [];
            arrayA.forEach(function (e) { if (arrayB.indexOf(e) === -1) diffArray.push(e); });
            return diffArray;
        }
        static readCSVToArray(inputString: string, delimiter: string): Array<Array<string>> {
            // ref: http://stackoverflow.com/a/1293163/2343
            delimiter = delimiter || ',';
            var regexp: RegExp = new RegExp((
                // Delimiters.
                "(\\" + delimiter + "|\\r?\\n|\\r|^)" +
                // Quoted fields.
                "(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|" +
                // Standard fields.
                "([^\"\\" + delimiter + "\\r\\n]*))"), 'gi');

            var arrayOfRows: Array<Array<string>> = [[]];
            var matched: RegExpExecArray;
            while (matched = regexp.exec(inputString)) {
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


