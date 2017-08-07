const CONST = require('../constants');
const MongoClient = require('mongodb').MongoClient

const state = {
  db: null,
}

const checkCache = async (cacheKey) => {
  const document = await state.db.collection('cache').findOne({cacheKey}, {_id: 0, result: 1 });
  return document ? document.result: '';
}

const saveCache = async (data, cacheKey) => {
  await state.db.collection('cache').insert({
      "createdAt": new Date(),
      "cacheKey": cacheKey,
      "result": data
    });
}

const retrieveUser = async (user) => {
  return await state.db.collection('users').findOne({user}, {_id: 0, user: 1 });
}

const retrieveComicsRead = async (user) => {
  return await state.db.collection('read').find({$or: [{ 'issues.0': {$exists: true}}, {wish: true}], user}, {'_id': 0, user: 0}).toArray();
}

const retrieveIssuesRead = async (comic, user) => {
  const results = await state.db.collection('read').findOne({comic, user}, {'_id': 0, issues: 1, wish: 1});
  const issuesRead = (results && results.issues) ? results.issues : [];
  const wish = results? results.wish: false;
  return [issuesRead, wish];
}

const markIssueRead = async (comic, issue, value, user) => {
  let operation = {};
  operation[value ? '$addToSet': '$pull'] = {issues: issue};
  return await state.db.collection('read').update({comic, user}, operation, {upsert: true});
}

const markComicWish = async (comic, value, user) => {
  return await state.db.collection('read').update({comic, user}, {$set: {wish: value}}, {upsert: true});
}

module.exports = {
  checkCache,
  saveCache,
  retrieveUser,
  retrieveComicsRead,
  retrieveIssuesRead,
  markIssueRead,
  markComicWish,
  connect: (url) => {
    MongoClient.connect(url, (err, db) => {
      if (err) throw new Error('Db connection fail');
      state.db = db;
    })
  }
}
