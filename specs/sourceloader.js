var Promise = require('promise');
var SourceLoader = require('../lib/sourceloader.js');

describe("SourceLoader", function() {
  var sourceLoader;

  beforeEach(function() {
    sourceLoader = new SourceLoader();
  });

  describe("load", function() {
    it("should return a promise", function() {
      expect(sourceLoader.load()).to.be.an.instanceof(Promise);
    });
  });
});