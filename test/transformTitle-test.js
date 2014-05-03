var assert = require('assert');
var should = require('should');
var wddoc = require('../index');

describe('wddoc', function(){
  it('should transform h1, h2 (...) into markdown title', function(done){
    var file = __dirname + '/fixtures/transformTitle.js';
    var options = {template: __dirname + '/../templates/markdox.md.ejs'};

    wddoc.process(file, options, function(err, output){
      should.not.exist(err);

      output.should.match(/\n# My first title/);
      output.should.match(/\n## My second title/);

      done();
    });
  })
})