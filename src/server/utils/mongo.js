const mongo = require('mongodb').MongoClient;
const CONST = require('../constants');

const checkCache = async (cacheKey) => {
  const db = await mongo.connect(CONST.MONGO_URL);
  const document = await db.collection('cache').findOne({cacheKey}, {_id: 0, result: 1 });
  await db.close();

  return document ? document.result: '';
}

const saveCache = async (data, cacheKey) => {
  const db = await mongo.connect(CONST.MONGO_URL);
  await db.collection('cache').insert({
      "createdAt": new Date(),
      "cacheKey": cacheKey,
      "result": data
    });
  await db.close();
}

const retrieveUser = async (user) => {
  const db = await mongo.connect(CONST.MONGO_URL);
  const document = await db.collection('users').findOne({user}, {_id: 0, user: 1 });
  await db.close();

  return document;
}

// TODO search filtering by user
const retrieveComicsRead = async (user) => {
  const db = await mongo.connect(CONST.MONGO_URL);
  const document = await db.collection('read').find({ 'issues.0': {$exists: true}}, {'_id': 0}).toArray();
  await db.close();

  return document;
}

// TODO search filtering by user
const retrieveIssuesRead = async (comic, user) => {
  const db = await mongo.connect(CONST.MONGO_URL);
  const results = await db.collection('read').findOne({ 'comic': comic}, {'_id': 0, issues: 1});
  await db.close();
  const document = results? results.issues: [];

  return document;
}

module.exports = {
  checkCache,
  saveCache,
  retrieveUser,
  retrieveComicsRead,
  retrieveIssuesRead
}
