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

