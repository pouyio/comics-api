const router = require('express').Router();
const get_cache_key = require('./utils/get_cache_key');
const mongo = require('./utils/mongo');
const CONST = require('./constants');

router.get(CONST.ROUTES.comic.issue, async (req, res, next) => {
  const response = await mongo.checkCache(get_cache_key('comics\\:detail\\::name\\::issue', req.params));

  if(response) {
    console.log('From cache');
    res.send(response);
  } else {
    next();
  }
});

module.exports = router;
