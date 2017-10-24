const cloudscraper = require('cloudscraper');

const make_request = url =>  new Promise((resolve, reject) => {
  cloudscraper.get(url, (error, response, body) => error ? reject(error): resolve(body));
});

Object.assign(module.exports, {
  makeRequest: make_request
})
