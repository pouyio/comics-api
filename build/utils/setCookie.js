'use strict';

var sourceServer = require('../source');
var CONST = require('../constants');

module.exports = async function (req, res, next) {
  await sourceServer.makeRequest({ url: CONST.SOURCE_URL });
  next();
};