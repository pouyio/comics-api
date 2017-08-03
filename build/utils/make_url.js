'use strict';

// TODO make base_url based on env dynamic
var base_url = 'http://localhost:8080';

var pathToRegexp = require('path-to-regexp');

module.exports = function (url, params) {
  var actual_url = pathToRegexp.compile(url)(params);
  return ('' + base_url + (actual_url[0] == '/' ? '' : '/') + actual_url).toLowerCase();
};