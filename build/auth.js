'use strict';

var router = require('express').Router();
var CONST = require('./constants');
var jwt = require('jsonwebtoken');
var mongo = require('./utils/mongo');
var sourceServer = require('./source');

var _secret = 'myPubL!cS3cr3t';
var globalUser = '';

var _check_token = async function _check_token(req, res, next) {
  var user = '';

  try {
    user = await jwt.verify(req.headers.authorization, _secret);
  } catch (e) {
    res.status(401).send(e);
    return;
  }

  // TODO avoid making this DB request everytime, save in memory or smth
  if (await mongo.retrieveUser(user)) {
    req.user = user;
    next();
    return;
  }

  res.status(401).send('User not registered');
};

router.post(CONST.ROUTES.auth.login, async function (req, res, next) {
  if (await mongo.retrieveUser(req.body.user)) {
    var token = jwt.sign(req.body.user, _secret);
    res.send(token);
    return;
  }

  res.status(401).send('User not registered');
});

router.get(CONST.ROUTES.img, async function (req, res) {
  var url = '' + CONST.SOURCE_URL + req.params['0'];
  try {
    var body = await sourceServer.makeRequest({ url: url, encoding: null });
    res.header('Content-Type', 'image/jpeg');
    res.send(body);
  } catch (err) {
    console.log(err);
    res.end();
  }
});

router.use(CONST.ROUTES.all, _check_token);

module.exports = router;