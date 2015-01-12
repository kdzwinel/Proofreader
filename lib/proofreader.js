var Sync = require('sync');
var cheerio = require('cheerio');
var Promise = require('promise');
var fs = require('fs');
var writeGood = require('write-good');
var nodehun = require('nodehun');
var spellcheck = require('nodehun-sentences');

module.exports = Proofreader;

function Proofreader() {
}

Proofreader.prototype.addDictionary = function (dicFilePath, affFilePath) {
  if (!this._dictionary) {
    this._dictionary = new nodehun(fs.readFileSync(affFilePath), fs.readFileSync(dicFilePath));
  } else {
    this._dictionary.addDictionary(fs.readFileSync(dicFilePath));
  }
};

Proofreader.prototype.setWhitelist = function (value) {
  this._whitelist = value;
};

Proofreader.prototype.setBlacklist = function (value) {
  this._blacklist = value;
};

Proofreader.prototype.proofread = function (html) {
  var $ = cheerio.load(html);
  var dictionary = this._dictionary;
  var whitelist = this._whitelist;
  var blacklist = this._blacklist;

  return new Promise(function(resolve, reject) {
    Sync(function () {
      var suggestions = [];

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
          suggestions.push({
            text: text,
            suggestions: {
              writeGood: writeGood(text),
              spelling: spellcheck.sync(null, dictionary, text)
            }
          })
        }
      });

      return suggestions;
    }, function (err, result) {
      if(err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
};