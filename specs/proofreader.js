var Proofreader = require('../lib/proofreader.js');
var Promise = require('promise');

describe("Proofreader", function() {
  var proofreader;

  beforeEach(function() {
    proofreader = new Proofreader();
  });

  describe("addDictionary", function() {
    it("should require main (first) dictionary to have both dic and aff file", function() {
      expect(proofreader.addDictionary.bind(proofreader,'./dictionaries/en_GB.dic')).to.throw(/path must be a string/);
      expect(proofreader.addDictionary.bind(proofreader,'./dictionaries/en_GB.dic', './dictionaries/en_GB.aff')).not.to.throw();
    });

    it("should not require additional dictionaries to have aff file", function() {
      proofreader.addDictionary('./dictionaries/en_GB.dic', './dictionaries/en_GB.aff');
      expect(proofreader.addDictionary.bind(proofreader,'./dictionaries/en_GB.dic')).not.to.throw();
    });
  });

  describe("setWhitelist", function() {
    it("should throw if something different than a string is provided", function () {
      expect(proofreader.setWhitelist.bind(proofreader, "p")).not.to.throw();
      expect(proofreader.setWhitelist.bind(proofreader, null)).to.throw(/must be a string/);
    });
  });

  describe("setBlacklist", function() {
    it("should throw if something different than a string is provided", function () {
      expect(proofreader.setBlacklist.bind(proofreader, "p")).not.to.throw();
      expect(proofreader.setBlacklist.bind(proofreader, null)).to.throw(/must be a string/);
    });
  });

  describe("setWriteGoodSettings", function() {
    it("should throw if something different than an object (or undefined) is provided", function () {
      expect(proofreader.setWriteGoodSettings.bind(proofreader, "")).to.throw();
      expect(proofreader.setWriteGoodSettings.bind(proofreader, {})).not.to.throw();
      expect(proofreader.setWriteGoodSettings.bind(proofreader)).not.to.throw();
    });
  });

  describe("proofread", function() {
    beforeEach(function() {
      proofreader.addDictionary('./dictionaries/en_GB.dic', './dictionaries/en_GB.aff');
      proofreader.setWhitelist('p');
    });

    it("should return a promise", function() {
      expect(proofreader.proofread("")).to.be.an.instanceof(Promise);
    });

    it("should produce an array of suggestions", function() {
      return proofreader.proofread("<p>Tezt.</p>").then(function(suggestions) {
        expect(suggestions).to.be.an.instanceof(Array);
        expect(suggestions[0]).to.have.all.keys('text', 'suggestions');
      });
    });

    it("should process only matching selectors", function() {
      return proofreader.proofread("<h1>H1 tezt.</h1><p>Paragraph tezt.</p><div>H2 tezt.</div>").then(function(suggestions) {
        expect(suggestions[0].text).to.be.equal("Paragraph tezt.");
      });
    });

    it("should process all matching selectors", function() {
      return proofreader.proofread("<p>Paragraph tezt1.</p><p>Paragraph tezt2.</p><p>Paragraph tezt3.</p>").then(function(suggestions) {
        expect(suggestions.length).to.be.equal(3);
      });
    });

    it("should remove blacklisted elements", function() {
      proofreader.setBlacklist('code');
      return proofreader.proofread("<p>A tezt <code>some code</code>.</p>").then(function(suggestions) {
        expect(suggestions[0].text).to.be.equal("A tezt .");
      });
    });

    it("should reduce number of whitespace characters", function() {
      return proofreader.proofread("<p>A    tezt.</p>").then(function(suggestions) {
        expect(suggestions[0].text).to.be.equal("A tezt.");
      });
    });

    it("should replace endline characters with spaces", function() {
      var text = "<p>A \
      tezt.\r\nAnd another one.</p>";

      return proofreader.proofread(text).then(function(suggestions) {
        expect(suggestions[0].text).to.be.equal("A tezt. And another one.");
      });
    });

    it("should replace ’ with '", function() {
      return proofreader.proofread("<p>A ’tezt’.</p>").then(function(suggestions) {
        expect(suggestions[0].text).to.be.equal("A 'tezt'.");
      });
    });

    it("should trim text", function() {
      return proofreader.proofread("<p>  A tezt.     </p>").then(function(suggestions) {
        expect(suggestions[0].text).to.be.equal("A tezt.");
      });
    });

    it("should work without a dictionary", function() {
      var proofreader = new Proofreader();
      proofreader.setWhitelist("p");

      return proofreader.proofread("<p>The cat was stolen.</p>").then(function(paragraphs) {
        expect(paragraphs[0].suggestions.spelling.length).to.be.equal(0);
        expect(paragraphs[0].suggestions.writeGood.length).not.to.be.equal(0);
      });
    });

    it("should use provided write-good settings", function () {
      proofreader.setWriteGoodSettings({passive: false});

      return proofreader.proofread("<p>The cat was stolen.</p>").then(function(paragraphs) {
        expect(paragraphs[0].suggestions.writeGood.length).to.be.equal(0);
      });
    });
  });
});