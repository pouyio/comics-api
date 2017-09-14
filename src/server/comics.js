const router = require('express').Router();
const sourceServer = require('./source');
const make_url = require('./utils/make_url');
const extract = require('./utils/extract');
const get_cache_key = require('./utils/get_cache_key');
const handleListing = require('./utils/handleListing');
const setCookie = require('./utils/setCookie');
const mongo = require('./utils/mongo');

const CONST = require('./constants');

// TODO DEPRACATED
router.get(CONST.ROUTES.comics.news, async (req, res) => {
  try {
    let body = await sourceServer.makeRequest({url: CONST.SOURCE_URL});
    let json = await extract.news(body, req);
    res.send(json);
  } catch (err) {
    console.log(err);
    res.end();
  }
});

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

// TODO DEPRACATED
router.get(CONST.ROUTES.comics.search_old, setCookie, async (req, res) => {
  let request_options = {
    url: `${CONST.SOURCE_URL}AdvanceSearch`,
    body: `comicName=${req.params.keyword || ''}&genres=0&genres=0&genres=0&genres=0&genres=0&genres=0&genres=0&genres=0&genres=0&genres=0&genres=0&genres=0&genres=0&genres=0&genres=0&genres=0&genres=0&genres=0&genres=0&genres=0&genres=0&genres=0&genres=0&genres=0&genres=0&genres=0&genres=0&genres=0&genres=0&genres=0&genres=0&genres=0&genres=0&genres=0&genres=0&genres=0&genres=0&genres=0&genres=0&genres=0&genres=0&genres=0&genres=0&genres=0&genres=0&genres=0&genres=0&status=`,
    method: 'post'
  };

  try {
    let body = await sourceServer.makeRequest(request_options);
    let json = extract.searchList(body, req);
    res.send(json);
  } catch (err) {
    console.log(err);
    res.end();
  }
});

// TODO DEPRACATED
router.get(CONST.ROUTES.comics.list, async (req, res) => {
  const url = `${CONST.SOURCE_URL}ComicList/`;
  const cache_key = get_cache_key("comics\\:letter\\::letter?\\:page\\::page?", req.params);
  const url_params = {};

  if (!!req.params.letter) {
    if (req.params.letter.match(/^[1-9][0-9]*$/) && !req.params.page) {
      req.params.page = req.params.letter;
      req.params.letter = undefined;
    }
  }

  if (!!req.params.letter) {
    url_params.c = req.params.letter;
  }

  if (!!req.params.page) {
    url_params.page = req.params.page;
  }

  try {
    let body = await sourceServer.makeRequest({url, qs: url_params});
    let json = await extract.listing(body, req);
    res.send(json);
  } catch (err) {
    console.log(err);
    res.end();
  }
});

// TODO: get all genres from source
router.get(CONST.ROUTES.genres, async (req, res) => {
  if (!!req.params.name) {
    try {
      let body = await handleListing('genre', req);
      let json = await extract.listing(body, req);
      res.send(json);
    } catch(e) {
      console.log(e);
      res.end();
    }
  }
  else {
    const data = CONST.GENRES.map((genre) => {
      const id = genre.replace(/[^a-z0-9 ]/ig, '').replace(/\s+/g, '-').toLowerCase();
      return {
        links: {
          self: make_url(`/genres/${id}`)
        },
        data: {
          type: 'genre',
          id,
          attributes: {
            name: genre
          }
        }
      }
    });

    res.json({ data });
  }
});

// TODO: get all publishers from source
router.get(CONST.ROUTES.publishers, async (req, res) => {
  try {
    let body = await handleListing('publisher', req);
    let json = await extract.listing(body, req);
    res.send(json);
  } catch(e) {
    console.log(e);
    res.end();
  }
});

// TODO: get all writers from source
router.get(CONST.ROUTES.writers, async (req, res) => {
  try {
    let body = await handleListing('writer', req);
    let json = await extract.listing(body, req);
    res.send(json);
  } catch(e) {
    console.log(e);
    res.end();
  }
});

// TODO: get all artists from source
router.get(CONST.ROUTES.artists, async (req, res) => {
  try {
    let body = await handleListing('artist', req);
    let json = await extract.listing(body, req);
    res.send(json);
  } catch(e) {
    console.log(e);
    res.end();
  }
});

module.exports = router;
