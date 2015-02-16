var fs = require('fs');
var request = require('request');
var Promise = require('promise');

module.exports = SourceLoader;

function getURI(uri) {
  return new Promise(function (resolve, reject) {
    request({uri: uri}, function (err, response, body) {
      if(response.statusCode >= 400) {
        err = "Response code " + response.statusCode;
      }

      resolve({
        type: 'uri',
        error: err,
        path: uri,
        content: body
      });
    });
  });
}

function getFile(path) {
  var content, error;

  try {
    content = fs.readFileSync(path).toString();
  } catch (e) {
    error = e.message;
  }

  return new Promise(function (resolve, reject) {
    resolve({
      type: 'file',
      error: error,
      path: path,
      content: content
    });
  });
}

function getSource(source) {
  return (/^[a-z]+:\/\//i).test(source) ? getURI(source) : getFile(source);
}

function SourceLoader() {
  this._sources = [];
}

/**
 * Add valid local path or URI to load contents from.
 * @param {String} source
 */
SourceLoader.prototype.add = function (source) {
  this._sources.push(source);
};

/**
 * Loads data from provided destinations and returns them via promise.
 * @returns {Promise}
 */
SourceLoader.prototype.load = function () {
  return Promise.all((this._sources).map(getSource));
};