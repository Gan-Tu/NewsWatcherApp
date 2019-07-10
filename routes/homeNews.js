/** A node module for home stories management. */
"use strict";
var express = require('express');
var ObjectID = require('mongodb').ObjectID;
var router = express.Router();

// get all top news when application UI is first seen by the user
router.get('/', function(req, res, next){
    req.db.collection.findOne({
        _id: ObjectID(process.env.GLOBAL_STORIES_ID)
    }, {
        homeNewsStories: 1
    }, function(err, doc) {
        if (err) {
            return next(err);
        } else if (!doc) {
            return next(new Error(
                `Cannot fetch global stories using id: ${GLOBAL_STORIES_ID}`
            ));
        }
        res.status(200).json(doc.homeNewsStories);
    })
});

module.exports = router;