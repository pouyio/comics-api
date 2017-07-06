const express = require('express');
const app = express();
const morgan = require('morgan');
const errorHandler = require('errorhandler');
const bodyParser = require('body-parser');
const comics = require('./comics');
const comicsCache = require('./comics-cache');

app.use(morgan('combined'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(errorHandler({showStack: true, dumpExceptions: true}));

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, x-xsrf-token');
  next();
});

// app.use('/', comicsCache);

app.use('/', comics);

app.listen(process.env.PORT || 8080, () => console.log(`Comics-api2 listening on port ${process.env.PORT || 8080}!`));
