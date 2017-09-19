const router = require('express').Router();
const CONST = require('./constants');
const jwt = require('jsonwebtoken');
const mongo = require('./utils/mongo');
const sourceServer = require('./utils/source');

const _check_token = async (req, res, next) => {
  try {
    req.user = await jwt.verify(req.headers.authorization, CONST.SECRET);
    next();
  } catch(e) {
    res.status(401).send(e);
  }
}

router.post(CONST.ROUTES.auth.login, async (req, res, next) => {
  if(await mongo.retrieveUser(req.body.user)) {
    const token = jwt.sign(req.body.user, CONST.SECRET);
    res.send(token);
    return;
  }

  res.status(401).send('User not registered');
})

router.get(CONST.ROUTES.img, async (req, res) => {
  const url = `${CONST.SOURCE_URL}${req.params['0']}`;
  try {
    const body = await sourceServer.makeRequest({url, encoding: null});
    res.header('Content-Type', 'image/jpeg');
    res.send(body);
  } catch (err) {
    console.log(err);
    res.end();
  }
})

router.use(CONST.ROUTES.all, _check_token);

module.exports = router;
