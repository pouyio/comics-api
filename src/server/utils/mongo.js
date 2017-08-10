const CONST = require('../constants');
const MongoClient = require('mongodb').MongoClient

const state = {
  db: null,
}

const getDb = async () => {
  if(state.db) return state.db;
  try {
    const db = await MongoClient.connect(CONST.MONGO_URL);
    state.db = db;
    return db;
  }catch (e) {
    throw new Error(e);
  }
}

const checkCache = async (cacheKey) => {
  const document = await (await getDb()).collection('cache').findOne({cacheKey}, {_id: 0, result: 1 });
  return document ? document.result: '';
}

const saveCache = async (data, cacheKey) => {
  await (await getDb()).collection('cache').insert({
      "createdAt": new Date(),
      "cacheKey": cacheKey,
      "result": data
    });
}

const retrieveUser = async (user) => {
  return await (await getDb()).collection('users').findOne({_id: user}, {_id:1});
}

const retrieveComicsRead = async (user) => {
  return await (await getDb()).collection('read').find({$or: [{ 'issues.0': {$exists: true}}, {wish: true}], user}, {'_id': 0, user: 0}).toArray();
}

const retrieveUserInfo = async (comic, user) => {
  const results = await (await getDb()).collection('read').findOne({comic, user}, {'_id': 0, issues: 1, wish: 1});
  const issuesRead = (results && results.issues) ? results.issues : [];
  const wish = results? results.wish: false;
  return [issuesRead, wish];
}

const markIssueRead = async (comic, issue, value, user) => {
  let operation = {};
  operation[value ? '$addToSet': '$pull'] = {issues: issue};
  return await (await getDb()).collection('read').update({comic, user}, operation, {upsert: true});
}

const markComicWish = async (comic, value, user) => {

  if (!value) {
    return await (await getDb()).collection('users').update({_id: user}, {$pull: {comics: { _id: comic}}});
  }

  const hasComic = await (await getDb()).collection('users').find({_id: user, "comics._id": comic}).count();

  if(!hasComic) {
    return await (await getDb()).collection('users').update({_id: user}, {"$push": {comics: {_id: comic, issues: []}}});
  }

  return {ok: 1};
}

const findComicById = async (comic) => {
  return await (await getDb()).collection('comics').findOne({_id: comic});
}

// const findIssueByIds = async (comic, issue) => {
//   return await (await getDb()).collection('comics').findOne({_id: comic});
// }

module.exports = {
  checkCache,
  saveCache,
  retrieveUser,
  retrieveComicsRead,
  retrieveUserInfo,
  markIssueRead,
  markComicWish,
  findComicById,
  connect: (url) => {
    MongoClient.connect(url, (err, db) => {
      if (err) throw new Error('Db connection fail');
      state.db = db;
    })
  }
}
