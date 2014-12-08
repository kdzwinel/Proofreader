//Helpers
var fs = require('fs');
var request = require('request');
var clc = require('cli-color');
var Sync = require('sync');
var cheerio = require('cheerio');
var program = require('commander');

program
  .option('-u, --url [url]', 'URL to website that should be proofread.')
  .parse(process.argv);

//Spelling dictionary setup
var spellcheck = require('nodehun-sentences');
var nodehun = require('nodehun');
var dict = new nodehun(
  fs.readFileSync('./dictionaries/en_US/en_US.aff'),
  fs.readFileSync('./dictionaries/en_US/en_US.dic')
);

var customDict = ['minifier', 'minifying', 'minified', 'DevTools', 'breakpoint', 'breakpoints', 'unminified', 'evals', 'evaled', 'debuggable', 'uncaught', 'protip', 'subtree', 'blackboxing', 'blackbox', 'async', 'callback', 'callbacks', 'CoffeeScript', 'JavaScript', 'CSS', 'HTML5', 'app', 'apps', 'checkbox', 'checkboxes', 'timeline', 'V8', 'Cmd', 'Ctrl', 'workflow', 'localhost', 'JSON', 'subfolder', 'webpage', 'XHR', 'SQL', 'WebKit', 'AppCache', 'SDK', 'WebView', 'plugin', 'ADB', 'USB', 'MAMP', 'IP', 'omnibox', 'screencast', 'Wi-Fi', 'Sass', 'KitKat', 'WebViews', 'screencasting', 'API', 'IDE', 'WebSocket', 'WebSockets', 'VM', 'GC', 'iframe', 'iframes', 'inline', 'sourcemaps', 'sourcemap', 'wiki', 'Esc', 'F5', 'F8', 'F10', 'F11', 'hostname'];

customDict.forEach(function(word) {
  dict.addWord(word);
});

//Hemingway-app-like suggestions
var writeGood = require('write-good');

request({uri: program.url}, function (err, response, body) {
  if (err) {
    throw err;
  }

  var $ = cheerio.load(body);

  Sync(function () {

    //Blacklist tags with code
    $('pre, code').remove();

    //Whitelist tags that should be processed
    $('p, li, h1, h2, h3').each(function () {
      var text = $(this).text();

      //remove linebreaks from text
      text = text.replace(/(\r\n|\n|\r)/gm," ");

      //replace ’ with '
      text = text.replace(/’/g, "'");

      var writeGoodSuggestions = writeGood(text);
      var spellingSuggestions = spellcheck.sync(null, dict, text);

      if(writeGoodSuggestions.length || spellingSuggestions.length) {
        console.log(clc.red(text));

        writeGoodSuggestions.forEach(function(item) {
          console.log(clc.blue.bold(' - ' + item.reason));
        });

        spellingSuggestions.forEach(function(item) {
          console.log(clc.magenta.bold(' - "' + item.word + '" -> ' + item.suggestions));
        });
      } else {
        console.log(clc.green(text));
      }

      console.log();
    });

  });

});
