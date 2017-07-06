var cheerio = require('cheerio');

// TODO refactor to es6
const pass = (url, html) => {

    return new Promise((resolve, reject) => {
      var regex = /setTimeout\(((?:.|\n)*?), 4000/igm;
      var challenge_function;
      var challenge_answer;

      challenge_function = regex.exec(html)[1];
      challenge_function = challenge_function.replace(/;/g, ";\n");

      challenge_function = challenge_function.replace('a.value =', 'return').replace('\/\//', '\\/\\//');

      var lines = challenge_function.split("\n");

      lines = lines.filter(function(line) {
        return !!line.match(/=\{/) || !!line.match(/[-+*\/]=/) || !!line.match(/parseInt/);
      });

      var protocol_domain = url.match(/(https?:\/\/[^\/]+)/)[0];

      lines.splice(-1, 0, "t = '" + protocol_domain.replace(/https?:\/\//, '') + "';");

      eval(" challenge_answer = (function() {\n" + lines.join("\n") + " '; 121' })();");

      var $ = cheerio.load(html);

      // <form id="challenge-form" action="/cdn-cgi/l/chk_jschl" method="get">
      //   <input type="hidden" name="jschl_vc" value="f36b73064deb84dfb4e09bc271af393d"/>
      //   <input type="hidden" name="pass" value="1473499531.4-TJDo+u8spw"/>
      //   <input type="hidden" id="jschl-answer" name="jschl_answer"/>
      // </form>
      var $challenge_form = $('#challenge-form');
      var new_url = protocol_domain + $challenge_form.attr('action');

      new_url += '?' + $challenge_form.find('input').toArray().map(function(item, index) {
        $item = $(item);
        return $item.attr('name') + '=' + ($item.attr('value') || challenge_answer);
      }).join('&');

      var request_options = {
        url: new_url,
        // TODO leave only one headers object global
        headers: {
          "Host": "readcomiconline.to",
          "Connection": "keep-alive",
          "Content-Length": "27",
          "Origin": "http://readcomiconline.to",
          "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.115 Safari/537.36",
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
          "Accept": "*/*",
          "X-Requested-With": "XMLHttpRequest",
          "DNT": "1",
          "Referer": url,
          "Accept-Encoding": "gzip, deflate",
          "Accept-Language": "es,en;q=0.8,fr;q=0.6,mt;q=0.4"
        },
        gzip: true
      };

      // Wait 4 seconds to simulate the sleep on the web page
      setTimeout(() => {
        resolve(request_options);
      }, 4000);
    });
}

const log = (challengeOptions, requestOptions) => {
  console.log('Challenge options:');
  console.log('url:', challengeOptions.url);
  console.log('headers:', challengeOptions.headers);

  console.log('------- Challenge options: -------');

  if (!!requestOptions.headers.Referer) {
    challengeOptions.headers.Referer = requestOptions.headers.Referer;
  }

  console.log(challengeOptions.headers["Referer"]);
  console.log(requestOptions.url);
  console.log(requestOptions.headers["Referer"]);
  console.log('------- /Challenge options: -------');
}

module.exports = {
  pass,
  log
}
