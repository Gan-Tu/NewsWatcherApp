/** A node module for shared news stories management. */
"use strict";
var express = require('express');
var joi = require('joi'); // data validation
var authHelper = require('./authHelper');
var ObjectID = require('mongodb').ObjectID;
var schema = require('./schema');

var router = express.Router();

const MAX_SHARED_STORIES = parseInt(process.env.MAX_SHARED_STORIES) || 30;
const MAX_COMMENTS = parseInt(process.env.MAX_COMMENTS) || 30;

/**
 * Share a news story
 */
router.post('/', authHelper.checkAuth, function(req, res, next) {
    joi.validate(req.body, schema.SHARED_STORY, function(err) {
        if (err) {
            return next(err);
        }
        // check our shared story limit
        // [DANGER] this method is not race-condition safe, but MongoDB
        // free tier doesn't support $where clause
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
                if (!req.body.comment) {
                    req.body.comment = `${req.auth.displayName} thinks the story is cool`;
                }
                var comment = createComment(req.auth.displayName,
                                            req.auth.userId,
                                            req.body.comment)
                // we set the id and guarantee uniqueness or failure happen
                var storyDoc = createSharedStory(req.body.story.storyID,
                                                 req.body.story,
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


/**
 * Delete a shared news story
 * [DANGER] Currently the api is exposed and allow all users to delete stories
 * so we use a very NAIVE way for restricting access
 */
router.delete('/:sid', authHelper.checkAuth, function(req, res, next) {
    if (req.query.admin_token != process.env.ADMIN_TOKEN) {
        // preliminary authentication, for development purpose
        return next(new Error("Only admin can delete comments right now"));
    }
    req.db.collection.findOneAndDelete({
        type: "SHAREDSTORY_TYPE",
        _id: ObjectID(req.params.sid)
    }, {
        returnOriginal: true
    }, function(err, result) {
        if (err) {
            console.log("[ERROR] Failed to delete shared story %d", req.params.sid);
            console.log("[ERROR] -- error:", err);
            return next(err);
        } else if (!result) {
            return next(new Error("Story was not found."));
        } else if (result.ok != 1) {
            console.log("[ERROR] Failed to delete shared story %d", req.params.sid);
            return next(new Error("Failed to delete the story"));
        } else {
            res.status(200).json({msg: "Shared story deleted successfully"});
        }
    })
});

/**
 * Add a comment to a shared story
 */
router.post('/:sid/comments', authHelper.checkAuth, function(req, res, next) {
    joi.validate(req.body, schema.POST_COMMENT, function(err) {
        if (err) {
            return next(err);
        }
        // check comment count
        // [DANGER] this method is not race-condition safe, but MongoDB
        // free tier doesn't support $where clause
        req.db.collection.findOne({
            type: "SHAREDSTORY_TYPE",
            _id: ObjectID(req.params.sid)
        }, function(err, doc) {
            if (err) {
                return next(err);
            } else if (!doc) {
                return next(new Error("Story was not found."));
            } else if (doc.comments.length >= MAX_COMMENTS) {
                return next(new Error("Max comments limit reached"));
            }
            // actually post the comment
            var comment = createComment(req.auth.displayName,
                                    req.auth.userId,
                                    req.body.comment);
            req.db.collection.findOneAndUpdate({
                type: "SHAREDSTORY_TYPE",
                _id: ObjectID(req.params.sid)
            }, {
                $push: {
                    comments: comment
                }
            }, {
                returnOriginal: false
            }, function(err, result) {
                if (err) {
                    console.log("[ERROR] Failed to post a comment to story:", req.params.sid);
                    console.log("[ERROR] -- error:", err);
                    return next(err);
                } else if (!result) {
                    return next(new Error("Story was not found."));
                } else if (result.ok != 1) {
                    console.log("[ERROR] Failed to post a comment to story:", req.params.sid);
                    return next(new Error("Failed to post comment"));
                } else {
                    res.status(201).json(result.value);
                }
            })
        });
    })
});

// return a new shared story
function createSharedStory(storyID, newsStory, shareComment) {
    return {
        _id: ObjectID(storyID),
        type: "SHAREDSTORY_TYPE",
        story: newsStory,
        comments: [ shareComment ]
    }
}

// return a new comment
function createComment(commenterName, commeterID, comment) {
    return {
        displayName: commenterName,
        userID: commeterID,
        dateTime: Date.now(),
        comment: comment
    }
}


module.exports = router;

