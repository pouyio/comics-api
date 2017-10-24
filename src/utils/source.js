const request = require('request-promise');
const challenge = require('./challenge');
const FileCookieStore = require("tough-cookie-filestore");
const fs = require('fs');
const path = require('path');

const cloudscraper = require('cloudscraper');

const _get_cookie_filename = () => {
  let full_path, stat;
  try {
    full_path = path.resolve('cookies.json');
    stat = fs.statSync(full_path);
  } catch (err) {
    let fd = fs.openSync(full_path, 'w');
    fs.closeSync(fs.openSync(full_path, 'w'));
  }

  return full_path;
};

const make_request1 = async (request_options) => {
  // TODO leave only one headers object global
  const request_headers = {
    "Host": 'readcomiconline.to',
    "Upgrade-Insecure-Requests": '1',
    "User-Agent": 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.115 Safari/537.36',
    "Accept": 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    "Accept-Encoding": 'gzip, deflate',
    "Accept-Language": 'es,en;q=0.8,fr;q=0.6,mt;q=0.4',
    "Content-Type": "application/x-www-form-urlencoded"
  };

  if (typeof request_options == 'string') {
    request_options = {
      url: request_options,
      headers: request_headers,
      jar: request.jar(new FileCookieStore(_get_cookie_filename())),
      gzip: true
    };
  } else if (typeof request_options == 'object') {

    Object.assign(request_options, {
      headers: Object.assign(request_headers, request_options.headers),
      jar: request.jar(new FileCookieStore(_get_cookie_filename())),
      gzip: true
    }, request_options);

  }

  if (!!request_options.qs) {
    var query_string_parameters = [];

    for (var key in request_options.qs) {
      query_string_parameters.push(`${key}=${request_options.qs[key]}`);
    }

    request_options.url += `?${query_string_parameters.join('&')}`;
    delete request_options.qs;
  }

  try {
    let res = await request(request_options);
    console.log('Challenge not needed');
    return res;

  } catch(e) {
    console.log('Challenge necessary, trying to pass it');
    let challenge_options = await challenge.pass(request_options.url, e.error);
    if(request_options.encoding === null) challenge_options.encoding = null;

    challenge.log(challenge_options, request_options);

    try {
      let a = await make_request(challenge_options);
      return a;
    } catch(err) {
      console.log(err);
    }
  }

}

const make_request = url =>  new Promise((resolve, reject) => {
  cloudscraper.get(url, (error, response, body) => error ? reject(error): resolve(body));
});


Object.assign(module.exports, {
  makeRequest: make_request
})
