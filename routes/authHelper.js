/** A node module to inject middleware that validates request user token. */
"use strict";
var jwt = require('jwt-simple'); // token authentication

/**
 * Check for a token in the custom header, setting and verifying that it is
 * signed and has not been tampered with.
 * If no header token is present, maybe the user is not logged in.
 * The JWT simple package will throw exceptions.
 */

module.exports.checkAuth = function(req, res, next) {
    var token = req.headers['x-auth'];
    if (token) { // logged-in user should have x-auth header set
        try {
            req.auth = jwt.decode(token, process.env.JWT_SECRET);
            if (req.auth && // token should exists
                req.auth.auth.authorized && // token should not be tampered with
                req.auth.userId) { // token should contain userId
                next();
            } else {
                return next(new Error("User is not logged in"));
            }
        } catch (err) {
            return next(err);
        }
    } else {
        return next(new Error("User is not logged in."));
    }
};