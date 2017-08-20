const router = require('express').Router();
const mongo = require('./utils/mongo');
const CONST = require('./constants');

router.get(CONST.ROUTES.comic.detail, async (req, res) => {
  const info = await mongo.retrieveComicUserInfo(req.params.name, req.user);
  Object.assign(res.locals, {info});
  res.send(res.locals);
});

router.post(CONST.ROUTES.comic.detail, async (req, res) => {
  const result = await mongo.markComicWish(req.params.name, req.body.wish, req.user);
  res.send(result);
});

router.get(CONST.ROUTES.comic.issue, async (req, res, next) => {
  const info = await mongo.retrieveIssueUserInfo(req.params.name, req.params.issue, req.user);
  Object.assign(res.locals, {info});
  res.send(res.locals);
});

router.post(CONST.ROUTES.comic.issue, async (req, res) => {
  const result = await mongo.markIssueRead(req.params.name, req.params.issue, req.body.read, req.user);
  res.send(result);
});

router.get(CONST.ROUTES.comics.read, async (req, res) => {
  const result = await mongo.retrieveComicsRead(req.user);
  res.send(result);
});

module.exports = router;
