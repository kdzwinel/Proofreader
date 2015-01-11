#!/usr/bin/env node

//Helpers
var fs = require('fs');
var request = require('request');
var program = require('commander');
var mime = require('mime');
var marked = require('marked');
var Promise = require('promise');
var config = require('../settings.json');
var Proofreader = require('../lib/proofreader.js');

program
  .option('-u, --url [url]', 'URL to website that should be proofread.')
  .option('-f, --file [path]', 'Path to HTML file that should be proofread.')
  .option('-l, --file-list [path]', 'Path to a list of files that should be proofread.')
  .option('-c, --config-file', 'Path to a configuration file')
  .parse(process.argv);

if(program.configFile) {
  config = require(program.configFile);
}

var proofreader = new Proofreader(config);

function toHTML(path, content) {
  var mimeType = mime.lookup(path);

  if(mimeType === 'text/x-markdown') {
    return marked(content);
  }

  return content;
}

var resultPromise = null;

if(program.url) {
  request({uri: program.url}, function (err, response, body) {
    if (err) {
      throw err;
    }

    resultPromise = proofreader.proofread(toHTML(program.url, body));
  });
} else if(program.file) {
  var content = fs.readFileSync(program.file).toString();

  resultPromise = proofreader.proofread(toHTML(program.file, content));
} else if(program.fileList) {
  var listOfFiles = fs.readFileSync(program.fileList).toString().split("\n");
  var promises = [];

  listOfFiles.forEach(function(filePath) {
    if(filePath) {
      var content = fs.readFileSync(filePath).toString();
      var promise = proofreader.proofread(toHTML(filePath, content));

      promises.push(promise);
    }
  });

  resultPromise = Promise.all(promises);
}

if(resultPromise) {
  resultPromise.then(null, function() {
    process.exit(1);
  })
}