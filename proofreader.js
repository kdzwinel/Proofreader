//Helpers
var fs = require('fs');
var request = require('request');
var clc = require('cli-color');
var Sync = require('sync');
var cheerio = require('cheerio');
var program = require('commander');
var mime = require('mime');
var marked = require('marked');

program
  .option('-u, --url [url]', 'URL to website that should be proofread.')
  .option('-f, --file [path]', 'Path to HTML file that should be proofread.')
  .option('-c, --include-correct', 'Include correct paragraphs in the output.')
  .parse(process.argv);

//Spelling dictionary setup
var spellcheck = require('nodehun-sentences');
var nodehun = require('nodehun');
var dict = new nodehun(
  fs.readFileSync('./dictionaries/en_US/en_US.aff'),
  fs.readFileSync('./dictionaries/en_US/en_US.dic')
);

var customDict = ['minifier', 'minifying', 'minified', 'DevTools', 'breakpoint', 'breakpoints', 'unminified', 'evals', 'evaled', 'debuggable', 'uncaught', 'protip', 'subtree', 'blackboxing', 'blackbox', 'async', 'callback', 'callbacks', 'CoffeeScript', 'JavaScript', 'CSS', 'HTML5', 'app', 'apps', 'checkbox', 'checkboxes', 'timeline', 'V8', 'Cmd', 'Ctrl', 'workflow', 'workflows', 'localhost', 'JSON', 'subfolder', 'webpage', 'XHR', 'SQL', 'WebKit', 'AppCache', 'SDK', 'WebView', 'plugin', 'ADB', 'USB', 'MAMP', 'IP', 'omnibox', 'screencast', 'Wi-Fi', 'Sass', 'KitKat', 'WebViews', 'screencasting', 'API', 'IDE', 'WebSocket', 'WebSockets', 'VM', 'GC', 'iframe', 'iframes', 'inline', 'sourcemaps', 'sourcemap', 'wiki', 'Esc', 'F1', 'F2', 'F5', 'F6', 'F8', 'F10', 'F11', 'F12', 'hostname', 'WebGL', 'iOS', 'MathML', 'UA', 'GPU', 'UI', 'geolocation', 'GPS', 'viewport', 'stylesheet', 'stylesheets', 'dpi', 'iPhone', 'PageUp', 'PageDown', 'W3C', 'SCSS', 'RGB', 'HSL', 'XPath', 'blog', 'GitHub', 'NodeJS', 'WebStorm', 'JetBrains', 'WebDriver', 'screenshot', 'screenshots', 'RSS', 'UX', 'codebase', 'IRC', 'fallback', 'inspectable', 'dropdown', 'IndexedDB', 'WebSQL', 'jQuery', 'timeline', 'timelines', 'jank', 'HAR', 'TTFB', 'DNS'];

customDict.forEach(function(word) {
  dict.addWord(word);
});

//Hemingway-app-like suggestions
var writeGood = require('write-good');

if(program.url) {
  request({uri: program.url}, function (err, response, body) {
    if (err) {
      throw err;
    }

    proofread(toHTML(program.url, body));
  });
} else if(program.file) {
  var content = fs.readFileSync(program.file).toString();

  proofread(toHTML(program.file, content));
}

function toHTML(path, content) {
  mime = mime.lookup(path);

  if(mime === 'text/x-markdown') {
    return marked(content);
  }

  return content;
}

function proofread(html) {
  var $ = cheerio.load(html);

  Sync(function () {

    //Blacklist tags with code
    $('pre, code').remove();

    //Whitelist tags that should be processed
    $('p, li, h1, h2, h3, h4, th, td, dl, figcaption').each(function () {
      var text = $(this).text();

      //remove linebreaks from text
      text = text.replace(/(\r\n|\n|\r)+/gm," ");

      //replace ’ with '
      text = text.replace(/’/g, "'");

      if(text.trim().length) {
        var writeGoodSuggestions = writeGood(text);
        var spellingSuggestions = spellcheck.sync(null, dict, text);

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
        } else if (program.includeCorrect) {
          console.log(clc.green(text));
          console.log();
        }
      }
    });

  });
}