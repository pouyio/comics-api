'use strict';

var router = require('express').Router();
var get_cache_key = require('./utils/get_cache_key');
var mongo = require('./utils/mongo');
var CONST = require('./constants');

router.get(CONST.ROUTES.comic.detail, async function (req, res, next) {
  var response = await mongo.checkCache(get_cache_key('comics\\:detail\\::name', req.params));

  if (response) {
    console.log('From cache');
    var issuesRead = await mongo.retrieveIssuesRead(req.params.name, req.user);
    Object.assign(response, { issuesRead: issuesRead });
    res.send(response);
  } else {
    next();
  }
});

router.get(CONST.ROUTES.comic.issue, async function (req, res, next) {
  var response = await mongo.checkCache(get_cache_key('comics\\:detail\\::name\\::issue', req.params));

  if (response) {
    console.log('From cache');
    res.send(response);
  } else {
    next();
  }
});

module.exports = router;