'use strict';

var pathToRegexp = require('path-to-regexp');

module.exports = function (template, data) {
  return pathToRegexp.compile(template)(data);
};