const fs = require('fs');
const https = require('https');
const express = require('express');
const app = express();
const morgan = require('morgan');
const errorHandler = require('errorhandler');
const bodyParser = require('body-parser');

const db = require('./utils/mongo');
const auth = require('./auth');
const comics = require('./comics');
const userInfo = require('./user-info');
const cors = require('./cors');
const CONST = require('./constants');

db.connect(process.env.MONGO_URL);

// MIDDLEWARE
app.use(morgan('combined'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(errorHandler({ showStack: true, dumpExceptions: true }));
// CORS middleware
app.use(cors);

app.get(CONST.ROUTES.root, (req, res) => res.json({ ok: 1 }));

// authentication middleware
app.use(CONST.ROUTES.root, auth);

// current app
app.use(CONST.ROUTES.root, comics);

// user middleware
app.use(CONST.ROUTES.root, userInfo);

if(process.env.NODE_ENV === 'production') {
    const options = {
        key: fs.readFileSync('/etc/letsencrypt/live/aws/privkey.pem'),
        cert: fs.readFileSync('/etc/letsencrypt/live/aws/fullchain.pem')
    }
    https
        .createServer(options || {}, app)
        .listen(process.env.PORT, () => console.log('Comics-api listenin on port ' + process.env.PORT));
    } else {
        
        require('http')
            .createServer(app)
            .listen(process.env.PORT, () => console.log('Comics-api listenin on port ' + process.env.PORT));
}

