'use strict';

var assert = require('assert'),
    fs = require('fs'),
    Apriori = require('../apriori.js');

describe('Apriori.Algorithm', function () {
  describe('#analyize(transactions)', function () {
    it('should return 5 association rules when analyzing dataset.csvs', function () {
      fs.readFile('dataset.csv', 'utf8', function (err, csv) {
        var transactions = Apriori.ArrayUtils.readCSVToArray(csv);
        var apriori = new Apriori.Algorithm(0.15, 0.6);
        var result = apriori.analyze(transactions);
        assert.equal(5, result.associationRules.length);
      });
    });
  });
});

