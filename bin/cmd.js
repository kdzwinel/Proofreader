#!/usr/bin/env node

//Helpers
var fs = require('fs');
var path = require('path');
var program = require('commander');
var mime = require('mime');
var marked = require('marked');
var clc = require('cli-color');
var Promise = require('promise');
var config = require('../settings.json');
var Proofreader = require('../lib/proofreader.js');
var SourceLoader = require('../lib/sourceloader.js');

program
  .option('-u, --url [url]', 'URL to website that should be proofread.')
  .option('-f, --file [path]', 'Path to HTML or Markdown file that should be proofread.')
  .option('-l, --file-list [path]', 'Path to a list of files that should be proofread.')
  .option('-c, --config-file [path]', 'Path to a custom configuration file.')
  .parse(process.argv);

//if custom config file was provided
if (program.configFile) {
  config = JSON.parse(fs.readFileSync(program.configFile));
}

//configuration validation
if (!config) {
  throw new Error('Configuration object missing.');
} else if (!config.dictionaries['build-in'] || !config.dictionaries['build-in'].length) {
  throw new Error('At least one build-in dictionary has to be set.');
} else if (!config.selectors || !config.selectors.whitelist) {
  throw new Error('Whitelist has to be set.');
}

var proofreader = new Proofreader();

proofreader.setWhitelist(config.selectors.whitelist);
proofreader.setBlacklist(config.selectors.blacklist);
proofreader.setWriteGoodSettings(config['write-good']);

config.dictionaries['build-in'].forEach(function (dictName) {
  proofreader.addDictionary(path.join(__dirname, '../dictionaries/' + dictName + '.dic'),
    path.join(__dirname, '../dictionaries/' + dictName + '.aff'));
});

if (config.dictionaries['custom']) {
  config.dictionaries['custom'].forEach(function (dictPath) {
    proofreader.addDictionary(dictPath);
  });
}

function toHTML(path, content) {
  var mimeType = mime.lookup(path);

  if (mimeType === 'text/markdown') {
    return marked(content);
  }

  return content;
}

function printResults(title, results) {
  console.log('### Results for ' + title + ' ###');
  console.log();

  results.forEach(function (result) {
    var writeGood = result.suggestions.writeGood;
    var spelling = result.suggestions.spelling;

    //Printing output
    if (writeGood.length || spelling.length) {
      console.log(clc.red(result.text));

      writeGood.forEach(function (item) {
        console.log(clc.blue.bold(' - ' + item.reason));
      });

      spelling.forEach(function (item) {
        console.log(clc.magenta.bold(' - "' + item.word + '" -> ' + item.suggestions));
      });

      console.log();
    }
  });
}

var sourceLoader = new SourceLoader();

//TODO #7 - there is no longer need to distinguish between a file and URI
if (program.url || program.file) {
  sourceLoader.add(program.url || program.file);
} else if (program.fileList) {
  var listOfFiles = fs.readFileSync(program.fileList).toString().split("\n");

  listOfFiles.forEach(function (path) {
    if (path.length > 0) {
      sourceLoader.add(path);
    }
  });
}

sourceLoader
  .load()
  .then(function (sources) {
    return Promise.all(sources.map(function (source) {
      if (source.error) {
        console.log("### Proofreader *failed* to load", source.path, "###");
        console.log(source.error);
        console.log();
        return;
      }

      return proofreader.proofread(toHTML(source.path, source.content))
        .then(function (result) {
          printResults(source.path, result);
          return result;
        });
    }));
  })
  .then(function (files) {
    files.forEach(function (paragraphs) {
      //if there are any suggestions exit with 1
      if (paragraphs && paragraphs.length > 0) {
        process.exit(1);
      }
    });
  });
