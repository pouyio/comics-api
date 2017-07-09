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

const retrieveComicsRead = async (user) => {
  const db = await mongo.connect(CONST.MONGO_URL);
  const document = await db.collection('read').find({ 'issues.0': {$exists: true}, user}, {'_id': 0, user: 0}).toArray();
  await db.close();

  return document;
}

const retrieveIssuesRead = async (comic, user) => {
  const db = await mongo.connect(CONST.MONGO_URL);
  const results = await db.collection('read').findOne({comic, user}, {'_id': 0, issues: 1});
  await db.close();
  const document = results? results.issues: [];

  return document;
}

const markIssueRead = async (comic, issue, value, user) => {
  let operation = {};
  operation[value ? '$addToSet': '$pull'] = {issues: `${comic}-${issue}`};

  const db = await mongo.connect(CONST.MONGO_URL);
  const result = await db.collection('read').update({comic, user}, operation, {upsert: true});
  await db.close();

  return result;
}


module.exports = {
  checkCache,
  saveCache,
  retrieveUser,
  retrieveComicsRead,
  retrieveIssuesRead,
  markIssueRead
}
