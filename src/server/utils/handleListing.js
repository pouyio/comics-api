const sourceServer = require('../source');
const CONST = require('../constants');
const get_cache_key = require('./get_cache_key');

module.exports = (type, request) => {
  const url = `${CONST.SOURCE_URL}${type}/${request.params.name}`;
  const cache_key = get_cache_key(`comics\\:${type}\\::name?\\:page\\::page?`, request.params);
  const url_params = {};

  if (!!request.params.page) {
    url_params.page = request.params.page;
  }

  return sourceServer.makeRequest({ url, qs: url_params });
}
