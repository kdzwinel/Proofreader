#!/usr/bin/env node

//Helpers
var fs = require('fs');
var path = require('path');
var request = require('request');
var program = require('commander');
var mime = require('mime');
var marked = require('marked');
var Promise = require('promise');
var clc = require('cli-color');
var config = require('../settings.json');
var Proofreader = require('../lib/proofreader.js');

program
  .option('-u, --url [url]', 'URL to website that should be proofread.')
  .option('-f, --file [path]', 'Path to HTML file that should be proofread.')
  .option('-l, --file-list [path]', 'Path to a list of files that should be proofread.')
  .option('-c, --config-file [path]', 'Path to a configuration file')
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

  if (mimeType === 'text/x-markdown') {
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

if (program.url) {
  request({uri: program.url}, function (err, response, body) {
    if (err) {
      throw err;
    }

    proofreader.proofread(toHTML(program.url, body))
      .then(function (results) {
        printResults(program.url, results);

        if(results.length) {
          process.exit(1);
        }
      });
  });
} else if (program.file) {
  var content = fs.readFileSync(program.file).toString();

  proofreader.proofread(toHTML(program.file, content))
    .then(function (results) {
      printResults(program.file, results);

      if(results.length) {
        process.exit(1);
      }
    });
} else if (program.fileList) {
  var listOfFiles = fs.readFileSync(program.fileList).toString().split("\n");
  var promises = listOfFiles.map(function (filePath) {
    if (filePath) {
      var content = fs.readFileSync(filePath).toString();
      return proofreader.proofread(toHTML(filePath, content))
        .then(function (result) {
          printResults(filePath, result);
          return result;
        });
    }
  });

  Promise.all(promises).then(function(files) {
    var clean = true;
    files.forEach(function(paragraphs) {
      if(paragraphs.length > 0) {
        clean = false;
      }
    });

    if(!clean) {
      process.exit(1);
    }
  })
}