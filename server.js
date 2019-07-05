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
    require('dotenv').require();
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

// serve static content from `build` directory
app.use(express.static(path.join(__dirname, 'build')));

