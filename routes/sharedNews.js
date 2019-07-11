/** A node module for shared news stories management. */
"use strict";
var express = require('express');
var joi = require('joi'); // data validation
var authHelper = require('./authHelper');
var ObjectID = require('mongodb').ObjectID;
var schema = require('./schema');

var router = express.Router();

const MAX_SHARED_STORIES = parseInt(process.env.MAX_SHARED_STORIES) || 30;

/**
 * Share a news story
 */
router.post('/', authHelper.checkAuth, function(req, res, next) {
    joi.validate(req.body, schema.SHARED_STORY, function(err) {
        if (err) {
            return next(err);
        }
        // check our shared story limit
        req.db.collection.count({
            type: "SHAREDSTORY_TYPE",
        }, function(err, count) {
            if (err) {
                return next(err);
            } else if (count > MAX_SHARED_STORIES) {
                return next(new Error("Shared story limit reached"));
            }
            // make sure the story is not already shared
            req.db.collection.count({
                type: "SHAREDSTORY_TYPE",
                _id: ObjectID(req.body.story.storyID)
            }, function(err, count) {
                if (err) {
                    return next(err);
                } else if (count > 0) {
                    return next(new Error("Story has already been shared"));
                }
                // set default comment, if necessary
                var comment = `${req.auth.displayName} thinks the story is cool`;
                if ("comment" in req.body && req.body.comment.length > 0) {
                    comment = req.body.comment;
                }
                // we set the id and guarantee uniqueness or failure happen
                var storyDoc = createSharedStory(req.body.story.storyID,
                                                 req.body.story,
                                                 req.auth.displayName,
                                                 req.auth.userId,
                                                 comment);
                // insert shared story
                req.db.collection.insertOne(storyDoc, function(err, result) {
                    if (err) {
                        return next(err);
                    }
                    res.status(201).json(result.ops[0]);
                })
            });
        })
    })
});


/**
 * Get all shared news stories
 */
router.get('/', authHelper.checkAuth, function(req, res, next) {
    req.db.collection.find({
        type: "SHAREDSTORY_TYPE",
    }).toArray(function(err, docs) {
        if (err) {
            return next(err);
        }
        res.status(200).json(docs);
    })
});

// return a new shared story
function createSharedStory(storyID,
                           newsStory,
                           commenterName,
                           commeterID,
                           comment) {
    return {
        _id: ObjectID(storyID),
        type: "SHAREDSTORY_TYPE",
        story: newsStory,
        comments: [{
            displayName: commenterName,
            userID: commeterID,
            dateTime: Date.now(),
            comment: comment
        }]

    }
}


module.exports = router;