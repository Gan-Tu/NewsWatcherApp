/** A node module for session login and logout. */
"use strict";
var express = require('express');
var bcrypt = require('bcryptjs'); // password hash comparison
var jwt = require('jwt-simple'); // token authentication
var joi = require('joi'); // data validation
var authHelper = require('./authHelper');
var schema = require('./schema');

var router = express.Router();

/**
 * login - create a session
 *
 * Create a security token as the user logs in that can passed to the client
 * and be used on subsequent calls.
 * The user email and password are sent in the body of the request.
 */
router.post('/', function(req, res, next) {
    joi.validate(req.body, schema.SESSION_BODY, function(err, unused) {
        if (err) {
            return next(new Error("Invalid request for login"));
        }
        // validate user information
        req.db.collection.findOne({
            type: "USER_TYPE",
            email: req.body.email
        }, function callback(err, user) {
            if (err) {
                return next(err);
            } else if (!user) {
                return next(new Error("User was not found."));
            }
            // check password
            bcrypt.compare(req.body.password, user.passwordHash,
                           function callback(err, matched) {
                if (err) {
                    return next(err);
                } else if (!matched) {
                    return next(new Error("Invalid credentials"));
                }
                // set authentication token
                try {
                    var userId = user._id.toHexString();
                    var displayName = user.displayName;

                    // generate authentication token
                    var token = jwt.encode({
                        authorized: true,
                        sessionIP: req.ip,
                        sessionUA: req.headers['user-agent'],
                        userId: userId,
                        displayName: displayName
                    }, process.env.JWT_SECRET);

                    // return session result
                    res.status(200).json({
                        displayName: displayName,
                        userId: userId,
                        token: token,
                        msg: "Successfully logged in"
                    });
                } catch (err) {
                    return next(err);
                }
            });
        })
    });
});


/**
 * logout - delete a session
 */
router.delete('/:id', authHelper.checkAuth, function(req, res, next) {
    // check that we are logging out the current logged-in user by
    // verifying the passed session id is the same as that in the auth token
    if (req.params.id != req.auth.userId) {
        return next(new Error("Invalid request for logout"));
    }
    res.status(200).json({ msg: "Successfully logged out"});
});


module.exports = router;


