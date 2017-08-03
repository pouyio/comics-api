'use strict';

var sourceServer = require('../source');
var CONST = require('../constants');
var get_cache_key = require('./get_cache_key');

module.exports = function (type, request) {
  var url = '' + CONST.SOURCE_URL + type + '/' + request.params.name;
  var cache_key = get_cache_key('comics\\:' + type + '\\::name?\\:page\\::page?', request.params);
  var url_params = {};

  if (!!request.params.page) {
    url_params.page = request.params.page;
  }

  return sourceServer.makeRequest({ url: url, qs: url_params });
};