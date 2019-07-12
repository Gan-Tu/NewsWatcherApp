"use strict";
var bcrypt = require('bcryptjs');
var https = require('https');
var async = require('async');
var assert = require('assert');
var ObjectID = require('mongodb').ObjectID;

// import environment secrets
if (process.env.PRODUCTION !== 'production') {
    // read secrets from '.env' file for local dev
    require('dotenv').config();
}


var globalNewsDoc;
const NYT_CATEGORIES = [
    "home",
    "world",
    "national",
    "business",
    "technology"
]

/** Database Connection */
var db = {}
const MongoClient = require('mongodb').MongoClient;

// connect to database
MongoClient.connect(process.env.MONGODB_CONNECT_URL,
                    function(err, client) {
    assert.equal(null, err);
    db.client = client;
    db.collection = client.db('newswatcherdb').collection('newswatcher');
    console.log("[INFO] Forked worker successfully connected to MongoDB database.");
});

// gracefully close the database connections
process.on('SIGINT', interrupt_cleanup);
process.on('SIGUSR2', interrupt_cleanup);
process.on('uncaughtException', interrupt_cleanup);

function interrupt_cleanup(err) {
    if (err) {
        console.log("[ERROR] Forked worker caught: ", err);
    }
    console.log('[INFO] Forked worker cleaning up before worker termination.');
    if (db && db.client) {
        db.client.close();
        console.log("[INFO] ... Forked worker's database connection gracefully closed.");
    }
    process.kill(process.pid);
}


/** Cross Process Communication */
process.on("message", function(msg) {
    if (msg.command) {
        console.log("[INFO] Forked worker received command %s for user %s",
                    msg.command, msg.user._id);
        if (msg.command == "REFRESH_STORIES") {
            setImmediate(function(user) {
                refreshStories(user, null)
            }, msg.user);
        }
    } else {
        console.log("[WARNING] Forked worker received malformed message from server.");
        console.log("[WARNING] The messages should contain a 'command' field; got:", msg);
    }
});


/** Child process procedures */

// ensure the global news document is initialized
// before `refreshStoriesFromGlobalDoc` is called
function refreshStories(user, callback) {
    if (!globalNewsDoc) {
        db.collection.findOne({
            _id: ObjectID(process.env.GLOBAL_STORIES_ID),
        }, function(err, doc) {
            if (err) {
                console.log("[ERROR] Forked worker failed to fetch global story: ", err);
                if (callback) {
                    return callback(err);
                } else {
                    return;
                }
            } else {
                globalNewsDoc = doc;
                return refreshStoriesFromGlobalDoc(user, callback);
            }
        })
    } else {
        return refreshStoriesFromGlobalDoc(user, callback);
    }
}


// actual work for fetching stories
function refreshStoriesFromGlobalDoc(user, callback) {
    var totalNewsAdded = 0;

    // loop through all news filters and seek matches for all returned stories
    for (var filterIdx = 0; filterIdx < user.newsFilters.length; filterIdx++) {
        var filter = user.newsFilters[filterIdx];
        var matchedNewStories = [];

        // we populate our new list by checking each new story in global document
        // against the keywords of the current filter for the user
        for (var i = 0; i < globalNewsDoc.newsStories.length; i++) {
            var story = globalNewsDoc.newsStories[i];
            // if the story matches any keyword in the current filter
            // we select the story as a candidate
            for (var j = 0; j < filter.keyWords.length; j++) {
                var keyword =  filter.keyWords[j].toLowerCase();
                if (storyMatchesKeyword(story, keyword)) {
                    matchedNewStories.push(story);
                    totalNewsAdded++;
                    break;
                }
            }
            // we stop looking for new stories, if we have reached the limit
            if (matchedNewStories.length == process.env.MAX_FILTER_STORIES) {
                break;
            }
        }
        // we push new found stories for the user, and keep the old ones if necessary
        // so as to limit the total number of stories to the maximum
        filter.newsStories = filter.newsStories.concat(matchedNewStories);
        filter.newsStories = filter.newsStories.slice(0, process.env.MAX_FILTER_STORIES);
    }

    // write update stories to database
    db.collection.findOneAndUpdate({
        _id: ObjectID(user._id)
    }, {
        $set: {
            "newsFilters": user.newsFilters
        }
    }, {
        returnOriginal: false
    }, function(err, result) {
        if (err) {
            console.log("[ERROR] Forked worker failed to update news due to:", err)
        } else if (!result) {
            err = new Error("[ERROR] Forked worker failed to update news b/c User was not found");
        } else if (result.ok != 1) {
            console.log("[ERROR] Forked worker failed to update news for user: ", user._id);
            err = new Error("Forked child failed to update news for user");
        } else if (user.newsFilters.length > 0) {
            console.log("[INFO] %d news in total are added for user %s",totalNewsAdded, user._id);
        } else {
            console.log("[WARNING] No news is added because user has no filters.");
        }
        if (callback) {
            return callback(err);
        }
    })
}

/** Utility functions */
function storyMatchesKeyword(story, keyword) {
    var title   =  story.title.toLowerCase();
    var content =  story.contentSnippet.toLowerCase()
    return title.indexOf(keyword) >= 0 ||
           content.indexOf(keyword) >= 0;
}


