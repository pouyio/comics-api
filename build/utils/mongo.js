'use strict';

var mongo = require('mongodb').MongoClient;
var CONST = require('../constants');

var checkCache = async function checkCache(cacheKey) {
  var db = await mongo.connect(CONST.MONGO_URL);
  var document = await db.collection('cache').findOne({ cacheKey: cacheKey }, { _id: 0, result: 1 });
  await db.close();

  return document ? document.result : '';
};

var saveCache = async function saveCache(data, cacheKey) {
  var db = await mongo.connect(CONST.MONGO_URL);
  await db.collection('cache').insert({
    "createdAt": new Date(),
    "cacheKey": cacheKey,
    "result": data
  });
  await db.close();
};

var retrieveUser = async function retrieveUser(user) {
  var db = await mongo.connect(CONST.MONGO_URL);
  var document = await db.collection('users').findOne({ user: user }, { _id: 0, user: 1 });
  await db.close();

  return document;
};

var retrieveComicsRead = async function retrieveComicsRead(user) {
  var db = await mongo.connect(CONST.MONGO_URL);
  var document = await db.collection('read').find({ 'issues.0': { $exists: true }, user: user }, { '_id': 0, user: 0 }).toArray();
  await db.close();

  return document;
};

var retrieveIssuesRead = async function retrieveIssuesRead(comic, user) {
  var db = await mongo.connect(CONST.MONGO_URL);
  var results = await db.collection('read').findOne({ comic: comic, user: user }, { '_id': 0, issues: 1 });
  await db.close();
  var document = results ? results.issues : [];

  return document;
};

var markIssueRead = async function markIssueRead(comic, issue, value, user) {
  var operation = {};
  operation[value ? '$addToSet' : '$pull'] = { issues: issue };

  var db = await mongo.connect(CONST.MONGO_URL);
  var result = await db.collection('read').update({ comic: comic, user: user }, operation, { upsert: true });
  await db.close();

  return result;
};

module.exports = {
  checkCache: checkCache,
  saveCache: saveCache,
  retrieveUser: retrieveUser,
  retrieveComicsRead: retrieveComicsRead,
  retrieveIssuesRead: retrieveIssuesRead,
  markIssueRead: markIssueRead
};