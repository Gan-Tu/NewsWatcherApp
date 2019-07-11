/** Application Dependencies */

// import core application dependencies.
var express = require('express');
var path = require('path'); // populating the path property of the request
var bodyParser = require('body-parser');
var cp = require('child_process');

// import application logging dependencies
var logger = require('morgan'); // HTTP request logging
var responseTime = require('response-time'); // performance logging
var assert = require('assert');

// import security mitigation dependencies
var helmet = require('helmet'); // HTTP header hack mitigations
var csp = require('helmet-csp'); // content security policies
var RateLimit = require('express-rate-limit'); // IP based rate limiter

// import environment secrets
if (process.env.PRODUCTION !== 'production') {
    // read secrets from '.env' file for local dev
    require('dotenv').config();
}

// import custom route handlers
var users = require('./routes/users');
var session = require('./routes/session');
var sharedNews = require('./routes/sharedNews');
var homeNews = require('./routes/homeNews');



/** Express Application Settings */

// set up the Express app
var app = express();
const PORT = process.env.PORT || 3000;

// header requests should include the IP of actual machine,
// instead of IPs of Nginx load balancers for AWS Elastic Beanstalk
app.enable('trust proxy');


/** Middleware */

// apply rate limits to all requests to avoid DOS/DDOS related attacks
var limiter = new RateLimit({
    windowsMs: 15*50*1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    delayMs: 0 // disable delaying - full speed until the max limit
});
app.use(limiter);

// HTTP application hack mitigations
app.use(helmet());

// prevent unknown resources from being injected into the application
app.use(csp({
    directives: {
        defaultSrc: ["'self'"],
        scriptSrc:  [
                     "'self'",
                     "'unsafe-inline'",
                     'ajax.googleapis.com',
                     'maxcdn.bootstrapcdn.com'
                    ],
        styleSrc:   ["'self'",
                     "'unsafe-inline'",
                     'maxcdn.bootstrapcdn.com'
                    ],
        fontSrc:    ["'self'",
                     'maxcdn.bootstrapcdn.com'
                    ],
        imgSrc:     ['*']
    }
}));

// add an X-Response-Time header to responses for performance logging
app.use(responseTime());

// log all HTTP requests
app.use(logger('dev'));

// parse JSON body of requests and make it available under `res.body`
// limit body to 100KB to avoid DOS/DDOS related attacks
app.use(bodyParser.json({ limit: '100kb' }));
app.use(bodyParser.urlencoded({ extended: true }))

// serve static content from `build` directory
app.use(express.static(path.join(__dirname, 'build')));




/** Background Processes */

// fire up a child process in a separate core to do background processing
// that is more intensive, so we free up the main Node process thread
console.log('[INFO] Trying to start the background worker...');
var node2 = cp.fork('./worker/app_FORK.js')
console.log('[INFO] Started background worker successfully.');

// restart child process on crash
node2.on('exit', restartWorker);

function restartWorker(code) {
    console.log("[ERROR] Background worker crashed with exit code: %d", code);
    node2 = undefined;
    // don't restart if this was a mocha test run.
    if (!server.testrun) {
        console.log('[INFO] Trying to restart background worker...');
        node2 = cp.fork('./worker/app_FORK.js');
        console.log('[INFO] ... Background worker restarted successfully.');
        node2.on('exit', restartWorker);
    }
}

/** Database Connection */

var db = {};
const MongoClient = require('mongodb').MongoClient;

// connect to database
MongoClient.connect(process.env.MONGODB_CONNECT_URL,
                    function(err, client) {
    assert.equal(null, err);
    console.log("[INFO] Successfully connected to MongoDB database.");
    db.client = client;
    db.collection = client.db('newswatcherdb').collection('newswatcher');
});

// gracefully close the database connections and kill background child process
process.on('SIGINT', interrupt_cleanup);
process.on('SIGUSR2', interrupt_cleanup);
// process.on('uncaughtException', interrupt_cleanup);

function interrupt_cleanup(err) {
    if (err) {
        console.log("[ERROR] Caught: ", err);
    }
    console.log('[INFO] Cleaning up before app termination.');
    if (db && db.client) {
        db.client.close();
        console.log('[INFO] ... Database connection gracefully closed.');
    }
    if (node2) {
        node2.kill();
        console.log('[INFO] ... Background worker gracefully killed.');
    }
    process.kill(process.pid);
}

// set the database connection for middleware usage
app.use(function (req, res, next) {
  req.db = db;
  req.node2 = node2;
  next();
});




/** Express Route Handlers */

// REST API routes
app.use('/api/users', users);
app.use('/api/session', session);
app.use('/api/sharedNews', sharedNews);
app.use('/api/homeNews', homeNews);

// catch 404 errors and forward to error handlers
app.use(function(req, res, next) {
    var err = new Error('404 Page Not Found');
    err.status = 400;
    next(err);
});

// development error handler will expose stack trace to users
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res = handle_error(err, res, true);
    });
}

// production error handler will NOT expose stack track to users
app.use(function(err, req, res, next) {
    res = handle_error(err, res, false);
});

function handle_error(err, res, exposeStackTrace) {
    let errorCode = err.status || 500;
    res.status(errorCode).json({
        message: err.toString(),
        error:   exposeStackTrace ? err : {}
    });
    console.log(`[ERROR] ${errorCode} error caught.`);
    console.log(err);
    return res;
}



/** Start the Application */

// route root to the main HTML in static folder
app.get('/', function (req, res) {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});


// start web server and listen on the given port
app.set('port', PORT);
var server = app.listen(PORT, function() {
    console.log(`[INFO] Express server listening on http://localhost:${PORT}`);
});

// export server for our testing framework

server.db = db;
server.node2 = node2;
module.exports = server;


