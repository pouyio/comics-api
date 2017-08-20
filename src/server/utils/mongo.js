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

// TODO DEPRACATED
const checkCache = async (cacheKey) => {
  const document = await (await getDb()).collection('cache').findOne({cacheKey}, {_id: 0, result: 1 });
  return document ? document.result: '';
}
// TODO DEPRACATED
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
  return await (await getDb()).collection('users').findOne({_id: user}, {_id: 0, comics: 1});
}

const retrieveComicUserInfo = async (comic, user) => {
  const aggregation = [];
  aggregation.push({$match: {_id: user}});
  aggregation.push({$unwind: '$comics'});
  aggregation.push({$match: {'comics._id': comic }});
  aggregation.push({$replaceRoot: { newRoot: "$comics" }});
  aggregation.push({$project: {_id: 0}});
  return await (await getDb()).collection('users').aggregate(aggregation).toArray();
}

const retrieveIssueUserInfo = async (comic, issue, user) => {
  const aggregation = [];
  aggregation.push({$match: {_id: user}});
  aggregation.push({$unwind: '$comics'});
  aggregation.push({$replaceRoot: { newRoot: "$comics" }});
  aggregation.push({$match: {_id: comic, [issue]: {$exists: true}}});
  aggregation.push({$project: {[issue]: 1, _id: 0}});
  aggregation.push({$replaceRoot: { newRoot: `$${issue}` }});

  const result =  await (await getDb()).collection('users').aggregate(aggregation).toArray();
  return result.length? result[0]: {};
}

const markIssueRead = async (comic, issue, value, user) => {
  const hasComic =  await (await getDb()).collection('users').find({_id: user, 'comics._id': comic}).count();

  if(!hasComic) {
    return await (await getDb()).collection('users').update({_id: user},
      {$push: {comics: {_id: comic, wish: true, [issue]: {page: 0, read: value}}}});
  }else {
    const aggregation = [];
    aggregation.push({$match: {_id: user}});
    aggregation.push({$unwind: '$comics'});
    aggregation.push({$match: {'comics._id': comic}});
    aggregation.push({$replaceRoot: { newRoot: "$comics" }});
    aggregation.push({$match: {[issue]: {$exists: true}}});

    const hasIssue =  await (await getDb()).collection('users').aggregate(aggregation).toArray();

    if(!hasIssue.length) {
      return await (await getDb()).collection('users').update({_id: user, 'comics._id': comic}, {$set: {[`comics.$.${issue}`]: {page: 0, read: value}}});
    }else {
      return await (await getDb()).collection('users').update({_id: user, 'comics._id': comic}, {$set: {[`comics.$.${issue}.read`]: value}});
    }
  }
}

const markComicWish = async (comic, value, user) => {

  const comicExists = await (await getDb()).collection('users').find({_id: user, 'comics._id': comic}).count();
  let match = {_id: user};
  let update = {};

  if(comicExists) {
    match['comics._id'] = comic;
    update['$set'] = {'comics.$.wish': value};
  }else {
    update['$push'] = {'comics': {_id: comic, wish: value}};
  }

  return await (await getDb()).collection('users').update(match, update);
}

const findComicById = async (comic) => {
  return await (await getDb()).collection('comics').findOne({_id: comic});
}

const findIssueById = async (comic, issue) => {
  const aggregation = [];
  aggregation.push({$match: {_id: comic}});
  aggregation.push({
    $project: {
      _id: 0,
      included: {
        $filter: {
          input: '$included',
          as: 'issue',
          cond: {
            $eq: ['$$issue.id', issue]
          }
        }
      }
    }
  });
  aggregation.push({$unwind: '$included'});
  return await (await getDb()).collection('comics').aggregate(aggregation).toArray();
}

const setPages = async (comic, issue, pages) => {
  (await getDb()).collection('comics').update({_id: comic, 'included.id' : issue}, {$set: {'included.$.pages': pages}});
}

module.exports = {
  checkCache,
  saveCache,
  retrieveUser,
  retrieveComicsRead,
  retrieveComicUserInfo,
  retrieveIssueUserInfo,
  markIssueRead,
  markComicWish,
  findComicById,
  findIssueById,
  setPages,
  connect: (url) => {
    MongoClient.connect(url, (err, db) => {
      if (err) throw new Error('Db connection fail');
      state.db = db;
    })
  }
}
