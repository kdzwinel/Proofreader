var Sync = require('sync');
var cheerio = require('cheerio');
var Promise = require('promise');
var fs = require('fs');
var writeGood = require('write-good');
var nodehun = require('nodehun');
var spellcheck = require('nodehun-sentences');

module.exports = Proofreader;

function Proofreader() {
  /**
   * @type nodehun
   * @private
   */
  this._dictionary = null;
  this._whitelist = '';
  this._blacklist = '';
  this._writeGoodSettings = null;
}

/**
 * Adds a dictionary. First dictionary has to provide both dic (words) and aff (grammar) filepaths, all subsequent ones are
 * expected to provide only dic filepath.
 *
 * @param {String} dicFilePath
 * @param {String} affFilePath
 */
Proofreader.prototype.addDictionary = function (dicFilePath, affFilePath) {
  if (!this._dictionary) {
    this._dictionary = new nodehun(fs.readFileSync(affFilePath), fs.readFileSync(dicFilePath));
  } else {
    this._dictionary.addDictionary(fs.readFileSync(dicFilePath));
  }
};

/**
 * Sets a selector with whitelisted elements
 * @param {String} value
 */
Proofreader.prototype.setWhitelist = function (value) {
  if(typeof value !== 'string') {
    throw new Error('Whitelist must be a string.');
  }
  this._whitelist = value;
};

/**
 * Sets a selector with blacklisted elements
 * @param {String} value
 */
Proofreader.prototype.setBlacklist = function (value) {
  if(typeof value !== 'string') {
    throw new Error('Blacklist must be a string.');
  }
  this._blacklist = value;
};

/**
 * Sets write-good settings object.
 * @see https://github.com/btford/write-good#checks
 * @param {Object} settings
 */
Proofreader.prototype.setWriteGoodSettings = function (settings) {
  if(settings !== undefined && typeof settings !== 'object') {
    throw new Error('Blacklist must be a string.');
  }
  this._writeGoodSettings = settings;
};

/**
 * Returns an array of writeGood and spelling suggestions (via promise) for provided HTML string
 * @param {String} html
 * @returns {Promise}
 */
Proofreader.prototype.proofread = function (html) {
  var $ = cheerio.load(html);
  var dictionary = this._dictionary;
  var whitelist = this._whitelist;
  var blacklist = this._blacklist;
  var writeGoodSettings = this._writeGoodSettings;

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

        //replace multiple spaces with a single one
        text = text.replace(/\s{2,}/g, ' ');

        //trim text
        text = text.trim();

        if(text.length) {
          var writeGoodSuggestions = writeGood(text, writeGoodSettings);
          var spellcheckerSuggestions = dictionary ? spellcheck.sync(null, dictionary, text) : [];

          suggestions.push({
            text: text,
            suggestions: {
              writeGood: writeGoodSuggestions,
              spelling: spellcheckerSuggestions
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