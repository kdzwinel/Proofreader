var path = require('path');
var clc = require('cli-color');
var Sync = require('sync');
var cheerio = require('cheerio');
var Promise = require('promise');
var fs = require('fs');
var writeGood = require('write-good');
var nodehun = require('nodehun');
var spellcheck = require('nodehun-sentences');

module.exports = Proofreader;

function Proofreader(settings) {
  if(!settings) {
    throw new Error('Settings object missing.');
  } else if(!settings.dictionaries['build-in'] || !settings.dictionaries['build-in'].length) {
    throw new Error('At least one build-in dictionary has to be set.');
  } else if(!settings.selectors || !settings.selectors.whitelist) {
    throw new Error('Whitelist has to be set.');
  }

  this._settings = settings;
  this._setupDictionaries(settings.dictionaries);
}

Proofreader.prototype._setupDictionaries = function(dictionaries) {
  var mainDictName = dictionaries['build-in'][0];
  dictionaries['build-in'].shift();

  //main dictionary
  var dict = new nodehun(
    fs.readFileSync(path.join(__dirname, '../dictionaries/' + mainDictName + '.aff')),
    fs.readFileSync(path.join(__dirname, '../dictionaries/' + mainDictName + '.dic'))
  );

  //other build-in dictionaries
  dictionaries['build-in'].forEach(function(dictName) {
    dict.addDictionary(path.join(__dirname, '../dictionaries/' + dictName + '.dic'));
  });

  //other custom dictionaries
  if(dictionaries['custom']) {
    dictionaries['custom'].forEach(function(dictPath) {
      dict.addDictionary(fs.readFileSync(dictPath));
    });
  }

  this._dictionary = dict;
};

Proofreader.prototype.proofread = function(html) {
  var $ = cheerio.load(html);
  var dictionary = this._dictionary;
  var whitelist = this._settings.selectors.whitelist;
  var blacklist = this._settings.selectors.blacklist;

  return new Promise(function(resolve, reject) {
    Sync(function () {
      var suggestionsCount = 0;

      //Blacklisted elements are removed before text is processed
      if(blacklist) {
        $(blacklist).remove();
      }

      //Only whitelisted elements are processed
      $(whitelist).each(function () {
        var text = $(this).text();

        //remove linebreaks from text
        text = text.replace(/(\r\n|\n|\r)+/gm," ");

        //replace ’ with '
        text = text.replace(/’/g, "'");

        if(text.trim().length) {
          var writeGoodSuggestions = writeGood(text);
          var spellingSuggestions = spellcheck.sync(null, dictionary, text);

          //Printing output
          if(writeGoodSuggestions.length || spellingSuggestions.length) {
            console.log(clc.red(text));

            writeGoodSuggestions.forEach(function(item) {
              console.log(clc.blue.bold(' - ' + item.reason));
            });

            spellingSuggestions.forEach(function(item) {
              console.log(clc.magenta.bold(' - "' + item.word + '" -> ' + item.suggestions));
            });

            console.log();
          }

          suggestionsCount += writeGoodSuggestions.length + spellingSuggestions.length;
        }
      });

      return suggestionsCount;
    }, function (err, result) {
      if(err || result !== 0) {
        reject();
      } else {
        resolve();
      }
    });
  });
};