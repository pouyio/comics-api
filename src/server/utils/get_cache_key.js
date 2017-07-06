const pathToRegexp = require('path-to-regexp');

module.exports = (template, data) => pathToRegexp.compile(template)(data);
