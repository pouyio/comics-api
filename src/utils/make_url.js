// TODO make base_url based on env dynamic
const base_url = 'http://localhost:8080';

const pathToRegexp = require('path-to-regexp');

module.exports = (url, params) => {
  const actual_url = pathToRegexp.compile(url)(params);
  return `${base_url}${actual_url[0] == '/' ? '' : '/'}${actual_url}`.toLowerCase();
};
