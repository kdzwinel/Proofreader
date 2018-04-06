var nock = require('nock');
var mockfs = require('mock-fs');
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

    describe("URI", function() {
      beforeEach(function() {
        nock('http://example.com')
          .get('/test.html')
          .reply(200, "ok");

        nock('http://example.com')
          .get('/404.html')
          .reply(404, "not ok");
      });

      it("should return file contents and path", function() {
        var path = 'http://example.com/test.html';
        sourceLoader.add(path);

        return sourceLoader.load().then(function(files) {
          expect(files.length).to.be.equal(1);
          expect(files[0].path).to.be.equal(path);
          expect(files[0].content).to.be.equal("ok");
        });
      });

      it("should return error messages if loading fails", function() {
        sourceLoader.add('http://example.com/404.html');

        return sourceLoader.load().then(function(files) {
          expect(files.length).to.be.equal(1);
          expect(files[0].error).to.be.equal("Response code 404");
        });
      });
    });

    describe("Filepath", function() {
      beforeEach(function() {
        mockfs({
          '/fake/dir': {
            'file.txt': 'ok'
          }
        });
      });

      it("should return file contents and path", function() {
        var path = '/fake/dir/file.txt';
        sourceLoader.add(path);

        return sourceLoader.load().then(function(files) {
          expect(files.length).to.be.equal(1);
          expect(files[0].path).to.be.equal(path);
          expect(files[0].content).to.be.equal("ok");
        });
      });

      it("should return error messages if loading fails", function() {
        var path = '/fake/dir/404.txt';
        sourceLoader.add(path);

        return sourceLoader.load().then(function(files) {
          expect(files.length).to.be.equal(1);
          expect(files[0].error).contains('no such file or directory');
        });
      });
    });
  });
});
