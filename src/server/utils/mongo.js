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

module.exports = {
  checkCache,
  saveCache
}
