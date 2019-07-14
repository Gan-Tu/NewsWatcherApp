/** A node module for home stories management. */

var express = require('express');
var router = express.Router();

// get all top news when application UI is first seen by the user
router.get('/', function(req, res, next){
    req.db.collection.findOne({
        type: "GLOBALSTORY_TYPE"
    }, {
        newsStories: 1
    }, function(err, doc) {
        if (err) {
            return next(err);
        } else if (!doc) {
            return next(new Error("Cannot fetch global stories"));
        }
        res.status(200).json(doc.newsStories);
    })
});

module.exports = router;