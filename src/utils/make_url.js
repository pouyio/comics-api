const base_url = process.env.API_URL;

const pathToRegexp = require('path-to-regexp');

module.exports = (url, params) => {
  const actual_url = pathToRegexp.compile(url)(params);
  return `${base_url}${actual_url[0] == '/' ? '' : '/'}${actual_url}`.toLowerCase();
};
