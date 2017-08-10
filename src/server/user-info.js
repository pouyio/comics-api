const router = require('express').Router();
const mongo = require('./utils/mongo');
const CONST = require('./constants');

router.get(CONST.ROUTES.comic.detail, async (req, res) => {
  const [issuesRead, wish] = await mongo.retrieveUserInfo(req.params.name, req.user);
  Object.assign(res.locals, {issuesRead, wish});
  res.send(res.locals);
});

router.post(CONST.ROUTES.comic.detail, async (req, res) => {
  const result = await mongo.markIssueRead(req.params.name, req.body.issue, req.body.read, req.user);
  res.send(result);
});

router.post(CONST.ROUTES.comic.wish, async (req, res) => {
  const result = await mongo.markComicWish(req.params.name, req.body.wish, req.user);
  res.send(result);
});

module.exports = router;
