const router = require('express').Router();
const mongo = require('./utils/mongo');
const CONST = require('./constants');

router.get(CONST.ROUTES.comic.detail, async (req, res) => {
  const info = await mongo.retrieveUserComicInfo(req.params.name, req.user) || {};
  for(const i in res.locals.included) {
    if(res.locals.included[i].type === 'issues') {
      const issueInfo = res.locals.included[i];
      const userInfo = info[issueInfo.id] || {read: false, page: 0};
      res.locals.included[i].read = userInfo.read;
      res.locals.included[i].page = userInfo.page;
    }
  }
  res.locals.wish = Object.keys(info).length ? info.wish: false;
  res.send(res.locals);
});

router.post(CONST.ROUTES.comic.detail, async (req, res) => {
  const result = await mongo.markComicWish(req.params.name, req.body.wish, req.user);
  res.send(result);
});

router.get(CONST.ROUTES.comic.issue, async (req, res, next) => {
  const info = await mongo.retrieveUserIssueInfo(req.params.name, req.params.issue, req.user);
  Object.assign(res.locals, {info});
  res.send(res.locals);
});

router.post(CONST.ROUTES.comic.issue, async (req, res) => {
  let resultPage, resultRead;

  if(req.body.page !== undefined) {
    resultPage = await mongo.markIssuePage(req.params.name, req.params.issue, req.body.page, req.user);
  }
  if(req.body.read !== undefined) {
    resultRead = await mongo.markIssueRead(req.params.name, req.params.issue, req.body.read, req.user);
  }

  res.send({ok: 1});
});

router.get(CONST.ROUTES.comics.read, async (req, res) => {
  const result = await mongo.retrieveComicsRead(req.user);
  res.send(result);
});

module.exports = router;
