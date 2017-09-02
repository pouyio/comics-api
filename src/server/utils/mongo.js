const CONST = require('../constants');
const MongoClient = require('mongodb').MongoClient

const _state = {
  db: null,
}

const _getDb = async () => {
  if(_state.db) return _state.db;
  try {
    const db = await MongoClient.connect(CONST.MONGO_URL);
    _state.db = db;
    return db;
  }catch (e) {
    throw new Error(e);
  }
}

const _ensureIssueExists = async (comic, issue, user) => {
  const hasComic =  await (await _getDb()).collection('users').find({_id: user, 'comics._id': comic}).count();

  if(!hasComic) {
    return await (await _getDb()).collection('users').update({_id: user},
      {$push: {comics: {_id: comic, wish: false, [issue]: {page: 0, read: false}}}});
  }

  const aggregation = [];
  aggregation.push({$match: {_id: user}});
  aggregation.push({$unwind: '$comics'});
  aggregation.push({$match: {'comics._id': comic}});
  aggregation.push({$replaceRoot: { newRoot: "$comics" }});
  aggregation.push({$match: {[issue]: {$exists: true}}});

  const hasIssue =  await (await _getDb()).collection('users').aggregate(aggregation).toArray();

  if(!hasIssue.length) {
    return await (await _getDb()).collection('users').update({_id: user, 'comics._id': comic}, {$set: {[`comics.$.${issue}`]: {page: 0, read: false}}});
  }
  return;
}

const retrieveUser = async (user) => {
  return await (await _getDb()).collection('users').findOne({_id: user}, {_id:1});
}

const retrieveComicsRead = async (user) => {
  return await (await _getDb()).collection('users').aggregate([{$match: {_id: user}}, {$project: {_id: 0, comics: 1}}, {$unwind: "$comics"}, {$replaceRoot: { newRoot: "$comics" }}]).toArray();
}

const retrieveUserComicInfo = async (comic, user) => {
  const aggregation = [];
  aggregation.push({$match: {_id: user}});
  aggregation.push({$unwind: '$comics'});
  aggregation.push({$match: {'comics._id': comic }});
  aggregation.push({$replaceRoot: { newRoot: "$comics" }});
  aggregation.push({$project: {_id: 0}});
  return await (await _getDb()).collection('users').aggregate(aggregation).toArray();
}

const retrieveUserIssueInfo = async (comic, issue, user) => {
  const aggregation = [];
  aggregation.push({$match: {_id: user}});
  aggregation.push({$unwind: '$comics'});
  aggregation.push({$replaceRoot: { newRoot: "$comics" }});
  aggregation.push({$match: {_id: comic, [issue]: {$exists: true}}});
  aggregation.push({$project: {[issue]: 1, _id: 0}});
  aggregation.push({$replaceRoot: { newRoot: `$${issue}` }});

  const result =  await (await _getDb()).collection('users').aggregate(aggregation).toArray();
  return result.length? result[0]: {};
}

const markIssueRead = async (comic, issue, isRead, user) => {
  await _ensureIssueExists(comic, issue, user);
  return await (await _getDb()).collection('users').update({_id: user, 'comics._id': comic}, {$set: {[`comics.$.${issue}.read`]: isRead}});
}

const markIssuePage = async(comic, issue, page, user) => {
  await _ensureIssueExists(comic, issue, user);
  return await (await _getDb()).collection('users').update({_id: user, 'comics._id': comic}, {$set: {[`comics.$.${issue}.page`]: page}});
}

const markComicWish = async (comic, value, user) => {

  const comicExists = await (await _getDb()).collection('users').find({_id: user, 'comics._id': comic}).count();
  let match = {_id: user};
  let update = {};

  if(comicExists) {
    match['comics._id'] = comic;
    update['$set'] = {'comics.$.wish': value};
  }else {
    update['$push'] = {'comics': {_id: comic, wish: value}};
  }

  return await (await _getDb()).collection('users').update(match, update);
}

const findComicById = async (comic) => {
  return await (await _getDb()).collection('comics').findOne({_id: comic});
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
  return await (await _getDb()).collection('comics').aggregate(aggregation).toArray();
}

const setPages = async (comic, issue, pages) => {
  (await _getDb()).collection('comics').update({_id: comic, 'included.id' : issue}, {$set: {'included.$.pages': pages}});
}

module.exports = {
  retrieveUser,
  retrieveComicsRead,
  retrieveUserComicInfo,
  retrieveUserIssueInfo,
  markIssueRead,
  markIssuePage,
  markComicWish,
  findComicById,
  findIssueById,
  setPages,
  connect: (url) => {
    MongoClient.connect(url, (err, db) => {
      if (err) throw new Error('Db connection fail');
      _state.db = db;
    })
  }
}
