const sourceServer = require('./source');
const CONST = require('../constants');

module.exports = async (req, res, next) => {
  await sourceServer.makeRequest({url: CONST.SOURCE_URL});
  next();
}
