const router = require('express').Router();
const sourceServer = require('./source');
const make_url = require('./utils/make_url');
const extract = require('./utils/extract');
const get_cache_key = require('./utils/get_cache_key');
const handleListing = require('./utils/handleListing');
const setCookie = require('./utils/setCookie');
const mongo = require('./utils/mongo');

const CONST = require('./constants');

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

router.get(CONST.ROUTES.comic.detail, async (req, res) => {
  const url = `${CONST.SOURCE_URL}Comic/${req.params.name}`;
  const cache_key = get_cache_key('comics\\:detail\\::name', req.params);

  try {
    let body = await sourceServer.makeRequest({url});
    let json = await extract.details(body, req);
    mongo.saveCache(json, cache_key);
    let issuesRead = await mongo.retrieveIssuesRead(req.params.name, 'pouyio');
    Object.assign(json, {issuesRead});
    res.send(json);
  } catch (err) {
    console.log(err);
    res.end();
  }

});

// TODO retrieve user from req.user, implement in auth middleware
router.post(CONST.ROUTES.comic.detail, async (req, res) => {
  let result = await mongo.markIssueRead(req.params.name, req.body.issue, req.body.read, 'pouyio');
  res.send(result);
});

router.get(CONST.ROUTES.comic.issue, async (req, res) => {
  const url = `${CONST.SOURCE_URL}Comic/${req.params.name}/${req.params.issue}?readType=1&quality=hq`;
  const cache_key = get_cache_key('comics\\:detail\\::name\\::issue', req.params);

  try {
    let body = await sourceServer.makeRequest({url});
    let json = await extract.issue(body, req);
    mongo.saveCache(json, cache_key);
    res.send(json);
  } catch (err) {
    console.log(err);
    res.end();
  }
});

// TODO download PDF
router.post(CONST.ROUTES.comic.issue, (req, res) => {

  res.send('pdf');

});

// TODO add cache
router.get(CONST.ROUTES.comics.search, setCookie, async (req, res) => {
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

router.get(CONST.ROUTES.comics.read, async (req, res) => {
  let result = await mongo.retrieveComicsRead('pouyio');
  res.send(result);
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
