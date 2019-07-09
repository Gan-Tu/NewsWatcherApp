/** A node module for user profile management. */
"use strict";
var express = require('express');
var bcrypt = require('bcryptjs'); // password hash comparison
var async = require('async');
var joi = require('joi'); // data validation
var authHelper = require('./authHelper');
var ObjectID = require('mongodb').ObjectID;

var router = express.Router();


/*
 * Requirements for password:
 * - 7 to 15 characters in length
 * - contain at least one numeric digit
 * - contain at least one uppercase letter
 * - contain at least one lowercase letter
 */
const PASSWORD_SALT_ROUNDS = process.env.PASSWORD_SALT_ROUNDS || 10;
// profile validation schema
const USER_CREATION_SCHEMA = {
    displayName:    joi.string()
                       .regex(/^[0-9a-zA-Z\s-]+$/)
                       .min(3)
                       .max(50)
                       .required(),
    email:          joi.string()
                       .email()
                       .min(7)
                       .max(50)
                       .required(),
    password:       joi.string()
                       .regex(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{7,15}$/)
                       .required()
};

const USER_PROFILE_UPDATE_SCHEMA = {
    requireWIFI:    joi.boolean()
                       .required(),
    enableAlerts:   joi.boolean()
                       .required(),
    newsFilters:    joi.array()
                       .max(5)
                       .required()
}
const NEWSFILTER_SCHEMA = {
    name:           joi.string()
                       .min(1)
                       .max(30)
                       .regex(/^[-_a-zA-Z0-9]+$/)
                       .required(),
    keyWords:       joi.array()
                       .max(10)
                       .items(joi.string()
                                 .trim()
                                 .max(20))
                       .required(),
    enableAlert:    joi.boolean(),
    alertFrequency: joi.number().min(0),
    enableAutoDelete: joi.boolean(),
    deleteTime:     joi.date(),
    timeOfLastScan: joi.date(),
    newsStories:    joi.array(),
    keywordsStr:    joi.string()
                       .min(1)
                       .max(100)
}

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
        }, function callback(err, user) {
            if (err) {
                return next(err);
            } else if (user) {
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

/**
 * User account deletion
 */
router.delete('/:id', authHelper.checkAuth, function(req, res, next) {
    // check that we are deleting the current logged-in user
    if (req.params.id != req.auth.userId) {
        return next(new Error("Invalid request for account deletion"));
    }
    // MongoDB should queue this up and retry if there is a conflict
    // This actually requires a write lock on their part.
    req.db.collection.findOneAndDelete({
        type: "USER_TYPE",
        _id: ObjectID(req.auth.userId)
    }, function callback(err, result) {
        if (err) {
            console.log("[ERROR] Failed to delete user id:", req.params.id);
            console.log("[ERROR] -- error:", err);
            return next(err);
        } else if (!result) {
            return next(new Error("User was not found."));
        } else if (result.ok != 1) {
            console.log("[ERROR] Failed to delete user id:", req.params.id);
            return next(new Error("Account deletion failed"));
        } else {
            res.status(200).json({ msg: "User successfully deleted." });
        }
    });
});


/**
 * User account retrieval
 */
router.get('/:id', authHelper.checkAuth, function(req, res, next) {
    if (req.params.id != req.auth.userId) {
        return next(new Error("Invalid request for account fetch"));
    }
    req.db.collection.findOne({
        type: "USER_TYPE",
        _id: ObjectID(req.auth.userId)
    }, function callback(err, user) {
        if (err) {
            return next(err);
        } else if (!user) {
            return next(new Error("User was not found."));
        }
        var userProfile = {
            email: user.email,
            displayName: user.displayName,
            date: user.date,
            settings: user.settings,
            newsFilters: user.newsFilters,
            savedStories: user.savedStories
        };
        // prevent UI presentation layer to use out-of-date user
        res.header("Cache-Control", "no-cache, no-store, must-revalidate");
        res.header("Pragma", "no-cache");
        res.header("Expires", 0);
        // send profile
        res.status(200).json(userProfile);
    });
});


/**
 * User account update
 */
router.put('/:id', authHelper.checkAuth, function(req, res, next) {
    if (req.params.id != req.auth.userId) {
        return next(new Error("Invalid request for account update"));
    }
    // validate body as a whole
    joi.validate(req.body, USER_PROFILE_UPDATE_SCHEMA, function(err, _) {
        if (err) {
            return next(err);
        }
        // validate keyword filters, asynchronously
        async.eachSeries(req.body.newsFilters, function(filter, callback) {
            joi.validate(filter, NEWSFILTER_SCHEMA, err => callback(err));
        }, function(err) {
            // MongoDB implements optimistic concurrency for us.
            // We were not holding on to the document anyway, so we just do a quick
            // read and replace of just those properties and not the complete document.
            // It matters if news stories were updated in the mean time
            // (i.e. user sat there taking their time updating their news profile)
            // because we will force that to update as part of this operation.
            // We need the new document, so a test could verify what happened,
            // otherwise the default is to return the original document.
            req.body.newsFilters = cleanNewsFilters(req.body.newsFilters);
            req.db.collection.findOneAndUpdate({
                type: 'USER_TYPE',
                _id: ObjectID(req.auth.userId)
            }, {
                $set: {
                    settings: {
                        requireWIFI: req.body.requireWIFI,
                        enableAlerts: req.body.enableAlerts
                    },
                    newsFilters: req.body.newsFilters
                }
            }, {
                returnOriginal: false
            }, function(err, result) {
                if (err) {
                    console.log("[ERROR] Failed to update user id:", req.params.id);
                    console.log("[ERROR] -- error:", err);
                    return next(err);
                } else if (!result) {
                    return next(new Error("User was not found."));
                } else if (result.ok != 1) {
                    console.log("[ERROR] Failed to update user id:", req.params.id);
                    return next(new Error("Account update failed"));
                } else {
                    // refresh news stories for the user
                    req.node2.send({
                        msg: "REFRESH_STORIES",
                        doc: result.value
                    })
                    res.status(200).json(result.value);
                }
            });
        });
    });
});


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

// trim leading and trailing spaces in filter's keywords
function cleanNewsFilters(filters) {
    for (var i = filters.length - 1; i >= 0; i--) {
        if ("keyWords" in filters[i]) {
            filters[i].keyWords = filters[i].keyWords
                                            .map(x => x.trim())
                                            .filter(x => x != "");
        }
    }
    return filters;
}

module.exports = router;

