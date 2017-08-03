'use strict';

var router = require('express').Router();
var sourceServer = require('./source');
var make_url = require('./utils/make_url');
var extract = require('./utils/extract');
var get_cache_key = require('./utils/get_cache_key');
var handleListing = require('./utils/handleListing');
var setCookie = require('./utils/setCookie');
var mongo = require('./utils/mongo');

var CONST = require('./constants');

router.get(CONST.ROUTES.comics.news, async function (req, res) {
  try {
    var body = await sourceServer.makeRequest({ url: CONST.SOURCE_URL });
    var json = await extract.news(body, req);
    res.send(json);
  } catch (err) {
    console.log(err);
    res.end();
  }
});

router.get(CONST.ROUTES.comic.detail, async function (req, res) {
  var url = CONST.SOURCE_URL + 'Comic/' + req.params.name;
  var cache_key = get_cache_key('comics\\:detail\\::name', req.params);

  try {
    var body = await sourceServer.makeRequest({ url: url });
    var json = await extract.details(body, req);
    if (json.data) {
      mongo.saveCache(json, cache_key);
      var issuesRead = await mongo.retrieveIssuesRead(req.params.name, req.user);
      Object.assign(json, { issuesRead: issuesRead });
    }
    res.send(json);
  } catch (err) {
    console.log(err);
    res.end();
  }
});

router.post(CONST.ROUTES.comic.detail, async function (req, res) {
  var result = await mongo.markIssueRead(req.params.name, req.body.issue, req.body.read, req.user);
  res.send(result);
});

router.get(CONST.ROUTES.comic.issue, async function (req, res) {
  var url = CONST.SOURCE_URL + 'Comic/' + req.params.name + '/' + req.params.issue + '?readType=1&quality=hq';
  var cache_key = get_cache_key('comics\\:detail\\::name\\::issue', req.params);

  try {
    var body = await sourceServer.makeRequest({ url: url });
    var json = await extract.issue(body, req);
    mongo.saveCache(json, cache_key);
    res.send(json);
  } catch (err) {
    console.log(err);
    res.end();
  }
});

// TODO download PDF
router.post(CONST.ROUTES.comic.issue, function (req, res) {

  res.send('pdf');
});

router.get(CONST.ROUTES.comics.search, setCookie, async function (req, res) {
  var request_options = {
    url: CONST.SOURCE_URL + 'AdvanceSearch',
    body: 'comicName=' + (req.params.keyword || '') + '&genres=0&genres=0&genres=0&genres=0&genres=0&genres=0&genres=0&genres=0&genres=0&genres=0&genres=0&genres=0&genres=0&genres=0&genres=0&genres=0&genres=0&genres=0&genres=0&genres=0&genres=0&genres=0&genres=0&genres=0&genres=0&genres=0&genres=0&genres=0&genres=0&genres=0&genres=0&genres=0&genres=0&genres=0&genres=0&genres=0&genres=0&genres=0&genres=0&genres=0&genres=0&genres=0&genres=0&genres=0&genres=0&genres=0&genres=0&status=',
    method: 'post'
  };

  try {
    var body = await sourceServer.makeRequest(request_options);
    var json = extract.searchList(body, req);
    res.send(json);
  } catch (err) {
    console.log(err);
    res.end();
  }
});

router.get(CONST.ROUTES.comics.list, async function (req, res) {
  var url = CONST.SOURCE_URL + 'ComicList/';
  var cache_key = get_cache_key("comics\\:letter\\::letter?\\:page\\::page?", req.params);
  var url_params = {};

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
    var body = await sourceServer.makeRequest({ url: url, qs: url_params });
    var json = await extract.listing(body, req);
    res.send(json);
  } catch (err) {
    console.log(err);
    res.end();
  }
});

router.get(CONST.ROUTES.comics.read, async function (req, res) {
  var result = await mongo.retrieveComicsRead(req.user);
  res.send(result);
});

// TODO: get all genres from source
router.get(CONST.ROUTES.genres, async function (req, res) {
  if (!!req.params.name) {
    try {
      var body = await handleListing('genre', req);
      var json = await extract.listing(body, req);
      res.send(json);
    } catch (e) {
      console.log(e);
      res.end();
    }
  } else {
    var data = CONST.GENRES.map(function (genre) {
      var id = genre.replace(/[^a-z0-9 ]/ig, '').replace(/\s+/g, '-').toLowerCase();
      return {
        links: {
          self: make_url('/genres/' + id)
        },
        data: {
          type: 'genre',
          id: id,
          attributes: {
            name: genre
          }
        }
      };
    });

    res.json({ data: data });
  }
});

// TODO: get all publishers from source
router.get(CONST.ROUTES.publishers, async function (req, res) {
  try {
    var body = await handleListing('publisher', req);
    var json = await extract.listing(body, req);
    res.send(json);
  } catch (e) {
    console.log(e);
    res.end();
  }
});

// TODO: get all writers from source
router.get(CONST.ROUTES.writers, async function (req, res) {
  try {
    var body = await handleListing('writer', req);
    var json = await extract.listing(body, req);
    res.send(json);
  } catch (e) {
    console.log(e);
    res.end();
  }
});

// TODO: get all artists from source
router.get(CONST.ROUTES.artists, async function (req, res) {
  try {
    var body = await handleListing('artist', req);
    var json = await extract.listing(body, req);
    res.send(json);
  } catch (e) {
    console.log(e);
    res.end();
  }
});

module.exports = router;