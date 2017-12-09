const issue = (body) => {
  const data = [];

  const lines = body.split('\n');

  for (var line of lines) {
    var match = line.match(/lstImages\.push\(["'](.*?)["']\);/i);

    if (!!match) {
      data.push(match[1]);
    }
  };

  var p = Promise.resolve(data);
  return p;
};

module.exports = {
  issue
}
