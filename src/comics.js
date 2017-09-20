const router = require('express').Router();
const sourceServer = require('./utils/source');
const extract = require('./utils/extract');
const mongo = require('./utils/mongo');

const CONST = require('./constants');

router.get(CONST.ROUTES.comic.detail, async (req, res, next) => {
  res.locals = await mongo.findComicById(req.params.name);
  next();
});

router.get(CONST.ROUTES.comic.issue, async (req, res, next) => {
  const issueDoc = await mongo.findIssueById(req.params.name, req.params.issue);
  const issue = issueDoc.length? issueDoc[0].included: issueDoc;
  if(!issue.pages) {
    const url = `${CONST.SOURCE_URL}Comic/${req.params.name}/${req.params.issue}?readType=1&quality=hq`;

    try {
      const body = await sourceServer.makeRequest({url});
      const pages = await extract.issue(body);
      mongo.setPages(req.params.name, req.params.issue, pages);
      issue.pages = pages;
    }catch(e) {
      console.log(err);
      issue.pages = err;
    }
  }
  res.locals = issue;
  next();
});

// TODO download PDF
// router.post(CONST.ROUTES.comic.issue, (req, res) => {
//
//   res.send('pdf');
//
// });

router.get(CONST.ROUTES.comics.search, async (req, res) => {
  const results = await mongo.search(req.query.exact, req.query.query);
  res.send(results);
});

module.exports = router;
