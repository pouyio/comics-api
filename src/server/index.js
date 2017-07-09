const express = require('express');
const app = express();
const morgan = require('morgan');
const errorHandler = require('errorhandler');
const bodyParser = require('body-parser');
const auth = require('./auth');
const comicsCache = require('./comics-cache');
const comics = require('./comics');
const CONST = require('./constants');

app.use(morgan('combined'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(errorHandler({showStack: true, dumpExceptions: true}));

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, x-xsrf-token');
  next();
});

app.get(CONST.ROUTES.root, (req, res) => res.json({ok: 1}));

// middleware
// app.use(CONST.ROUTES.root, auth);
// middleware
// app.use(CONST.ROUTES.root, comicsCache);

app.use(CONST.ROUTES.root, comics);

app.listen(process.env.PORT || 8080, () => console.log(`Comics-api2 listening on port ${process.env.PORT || 8080}!`));
