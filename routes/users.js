/** A node module for user profile management. */
"use strict";
var express = require('express');
var bcrypt = require('bcryptjs'); // password hash comparison
var async = require('async');
var joi = require('joi'); // data validation
var authHelper = require('./authHelper');
var objectId = require('mongodb').ObjectID;

var router = express.Router();

/*
 * Requirements for password:
 * - 7 to 15 characters in length
 * - contain at least one numeric digit
 * - contain at least one uppercase letter
 * - contain at least one lowercase letter
 */
const PASSWORD_SCHEMA =
    /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{7,15}$/;
const NAME_SCHEMA = /^[0-9a-zA-Z\s-]+$/;
const USER_CREATION_SCHEMA = {
    displayName: joi.string().regex(NAME_SCHEMA).min(3).max(50).required(),
    email: joi.string().email().min(7).max(50).required(),
    password: joi.string().regex(PASSWORD_SCHEMA).required()
};
const PASSWORD_SALT_ROUNDS = 10;

/**
 * User account creation
 */
router.post('/', function(req, res, next) {
    // validate user input
    console.log(req.body);
    joi.validate(req.body, USER_CREATION_SCHEMA, function(err, value) {
        if (err) {
            return next(err);
        }
        // check for duplication
        req.db.collection.findOne({
            type: "USER_TYPE",
            email: req.body.email
        }, function callback(err, doc) {
            if (err) {
                return next(err);
            } else if (doc) {
                return next(new Error("Email is already in use by an account."));
            }
            // create user
            bcrypt.hash(req.body.password, PASSWORD_SALT_ROUNDS,
                        function(err, passwordHash) {
                if (err) {
                    return next(err);
                }
                var userDoc = createUserDocument(req.body.displayName,
                                                 req.body.email,
                                                 passwordHash);
                req.db.collection.insertOne(userDoc, function(err, result) {
                    if (err) {
                        return next(err);
                    }
                    var insertedDoc = result.ops[0];
                    // get initial matching stories using forked child process
                    req.node2.send({
                        msg: "REFRESH_STORIES",
                        doc: insertedDoc
                    });
                    // return result
                    res.status(201).json(insertedDoc);
                });
            });
        });
    });
})


// create a new, default user document
function createUserDocument(displayName, email, passwordHash) {
    return {
        type: 'USER_TYPE',
        displayName: displayName,
        email: email,
        passwordHash: passwordHash,
        date: Date.now(),
        completed: false,
        settings: {
            requireWIFI: true,
            enableAlerts: false
        },
        savedStories: [],
        newsFilters: [
            {
                'name': "Technology Companies",
                "keyWords": [
                    "Apple",
                    "Microsoft",
                    "IBM",
                    "Amazon",
                    "Google",
                    "Intel"
                ],
                "enableAlert": false,
                "alertFrequency": 0,
                "enableAutoDelete": false,
                "deleteTime": 0,
                "timeOfLastScan": 0,
                "newsStories": []
            }
        ]
    }
}

module.exports = router;

