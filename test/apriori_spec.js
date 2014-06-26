'use strict';

var assert = require('assert'),
    fs = require('fs'),
    Apriori = require('../apriori.js');

describe('Apriori.Algorithm', function () {
    describe('#analyize(transactions)', function () {

        it('should return 5 association rules with default settings', function () {
            fs.readFile('dataset.csv', 'utf8', function (err, csv) {
                var transactions = Apriori.ArrayUtils.readCSVToArray(csv);
                var apriori = new Apriori.Algorithm(0.15, 0.6);
                var result = apriori.analyze(transactions);
                assert.equal(5, result.associationRules.length);
            });
        });

        it('should return 4 association rules with confidence:0.8', function () {
            fs.readFile('dataset.csv', 'utf8', function (err, csv) {
                var transactions = Apriori.ArrayUtils.readCSVToArray(csv);
                var apriori = new Apriori.Algorithm(0.15, 0.8);
                var result = apriori.analyze(transactions);
                assert.equal(4, result.associationRules.length);
            });
        });

    });
});

