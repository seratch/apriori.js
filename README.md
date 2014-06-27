## Aprioir.js

[Apriori Algorithm](http://en.wikipedia.org/wiki/Apriori_algorithm) implementation in (TypeScript|JavaScript) which is based on https://github.com/asaini/Apriori/blob/master/apriori.py.

[![Build Status](https://travis-ci.org/seratch/apriori.js.svg)](https://travis-ci.org/seratch/apriori.js)

### npm package

[![NPM](https://nodei.co/npm/apriori.png?downloads=true)](https://npmjs.org/package/apriori)

    npm install apriori

### bower package

http://bower.io/search/?q=apriori

    bower install apriori --save-dev

### Usage

    // curl https://raw.githubusercontent.com/asaini/Apriori/master/INTEGRATED-DATASET.csv -o dataset.csv
    // on the Node.js REPL
    var Apriori = require('apriori');
    new Apriori.Algorithm(0.15, 0.6, false).showAnalysisResultFromFile('dataset.csv');

### Development

- `grunt` opens an example in your browser
- `grunt test` runs all the tests.
- `grunt build` creates aprori.js and apriori.min.js

### License

the MIT License


