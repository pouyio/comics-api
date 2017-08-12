const router = require('express').Router();
const CONST = require('./constants');
const jwt = require('jsonwebtoken');
const mongo = require('./utils/mongo');
const sourceServer = require('./source');

const _secret = 'myPubL!cS3cr3t';

const _check_token = async (req, res, next) => {
  let user = '';

  try {
    user = await jwt.verify(req.headers.authorization, _secret);
  } catch(e) {
    res.status(401).send(e);
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

router.post(CONST.ROUTES.auth.login, async (req, res, next) => {
  if(await mongo.retrieveUser(req.body.user)) {
    let token = jwt.sign(req.body.user, _secret);
    res.send(token);
    return;
  }

  res.status(401).send('User not registered');
})

router.get(CONST.ROUTES.img, async (req, res) => {
  const url = `${CONST.SOURCE_URL}${req.params['0']}`;
  try {
    let body = await sourceServer.makeRequest({url, encoding: null});
    res.header('Content-Type', 'image/jpeg');
    res.send(body);
  } catch (err) {
    console.log(err);
    res.end();
  }
})

router.use(CONST.ROUTES.all, _check_token);

module.exports = router;
