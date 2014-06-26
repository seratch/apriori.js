## Aprioir.js

[Apriori Algorithm](http://en.wikipedia.org/wiki/Apriori_algorithm) implementation in (TypeScript|JavaScript) which is based on https://github.com/asaini/Apriori/blob/master/apriori.py.

[![NPM](https://nodei.co/npm/apriori.png?downloads=true)](https://npmjs.org/package/apriori)

### Usage

    // curl https://raw.githubusercontent.com/asaini/Apriori/master/INTEGRATED-DATASET.csv -o dataset.csv
    // on the Node.js REPL
    var Apriori = require('apriori');
    new Apriori.Algorithm(0.15, 0.6, false).showAnalysisResultFromFile('dataset.csv');

### License

the MIT License


