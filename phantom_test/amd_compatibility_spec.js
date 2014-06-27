(function() {
'use strict';

describe('Apriori.Algorithm (AMD)', function(){
    it('should exist', function() {
        var apriori = new Apriori.Algorithm(0.15, 0.6);
        apriori.analyze([[1,2,3], [2,3], [3]]);
    });
});

}());

