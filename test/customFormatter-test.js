var assert = require('assert');
var should = require('should');
var wddoc  = require('../index');

var formatter = function(docfile) {
    var docfile = wddoc.defaultFormatter(docfile);
    docfile.javadoc[0].description += ' updated';
    return docfile;
};

describe.only('wddoc', function() {
    it('should transform h1, h2 (...) into markdown title with custom formatter', function(done) {
        var file = __dirname + '/fixtures/transformTitle.js';

        var options = {
            formatter: formatter,
            template: __dirname + '/../templates/markdox.md.ejs'
        };

        wddoc.process(file, options, function(err, output) {
            should.not.exist(err);

            output.should.match(/\n# My first title updated/);
            output.should.match(/\n## My second title/);

            done();
        });
    });
});