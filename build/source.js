'use strict';

var _typeof2 = require('babel-runtime/helpers/typeof');

var _typeof3 = _interopRequireDefault(_typeof2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var request = require('request-promise');
var challenge = require('./challenge');
var FileCookieStore = require("tough-cookie-filestore");
var fs = require('fs');
var path = require('path');

var _get_cookie_filename = function _get_cookie_filename() {
  var full_path = void 0,
      stat = void 0;
  try {
    full_path = path.resolve('cookies.json');
    stat = fs.statSync(full_path);
  } catch (err) {
    var fd = fs.openSync(full_path, 'w');
    fs.closeSync(fs.openSync(full_path, 'w'));
  }

  return full_path;
};

var make_request = async function make_request(request_options) {
  // TODO leave only one headers object global
  var request_headers = {
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
  } else if ((typeof request_options === 'undefined' ? 'undefined' : (0, _typeof3.default)(request_options)) == 'object') {

    Object.assign(request_options, {
      headers: Object.assign(request_headers, request_options.headers),
      jar: request.jar(new FileCookieStore(_get_cookie_filename())),
      gzip: true
    }, request_options);
  }

  if (!!request_options.qs) {
    var query_string_parameters = [];

    for (var key in request_options.qs) {
      query_string_parameters.push(key + '=' + request_options.qs[key]);
    }

    request_options.url += '?' + query_string_parameters.join('&');
    delete request_options.qs;
  }

  try {
    var res = await request(request_options);
    console.log('Challenge not needed');
    return res;
  } catch (e) {
    console.log('Challenge necessary, trying to pass it');
    var challenge_options = await challenge.pass(request_options.url, e.error);
    if (request_options.encoding === null) challenge_options.encoding = null;

    challenge.log(challenge_options, request_options);

    try {
      var a = await make_request(challenge_options);
      return a;
    } catch (err) {
      console.log(err);
    }
  }
};

Object.assign(module.exports, {
  makeRequest: make_request
});