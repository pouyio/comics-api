const router = require('express').Router();
const CONST = require('./constants');
const jwt = require('jsonwebtoken');
const mongo = require('./utils/mongo');

const _secret = 'myPubL!cS3cr3t';
var globalUser = '';

const _check_token = async (req, res, next) => {
  let user = '';

  try {
    user = await jwt.verify(req.headers.authorization, _secret);
  } catch(e) {
    res.send(e);
    return;
  }

  // TODO avoid making this DB request everytime, save in memory or smth
  if(await mongo.retrieveUser(user)) {
    req.user = user;
    next();
    return;
  }

  res.status(401).send('User not registered');
}

router.post(CONST.ROUTES.auth.login, (req, res, next) => {
  let token = jwt.sign(req.body.user, _secret);
  res.send(token);
})

router.use(CONST.ROUTES.all, _check_token);

module.exports = router;
