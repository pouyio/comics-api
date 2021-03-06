const router = require('express').Router();
const CONST = require('./constants');
const jwt = require('jsonwebtoken');
const mongo = require('./utils/mongo');
const sourceServer = require('./utils/source');

const _check_token = async (req, res, next) => {
  try {
    req.user = await jwt.verify(req.headers.authorization, process.env.SECRET);
    next();
  } catch(e) {
    res.status(401).send(e);
  }
}

router.post(CONST.ROUTES.auth.login, async (req, res, next) => {
  if(await mongo.retrieveUser(req.body.user)) {
    const token = jwt.sign(req.body.user, process.env.SECRET);
    res.send(token);
    return;
  }

  res.status(401).send('User not registered');
})

router.get(CONST.ROUTES.img, async (req, res) => {
  const url = `${process.env.SOURCE_URL}${req.params['0']}`;
  try {
    const {body, type} = await sourceServer.makeRequest(url);
    res.header('Content-Type', type);
    res.send(body);
  } catch (err) {
    console.log(err);
    res.end();
  }
})

router.use(CONST.ROUTES.all, _check_token);

module.exports = router;
