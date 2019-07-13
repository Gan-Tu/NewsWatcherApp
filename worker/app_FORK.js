"use strict";
var bcrypt = require('bcryptjs');
var https = require('https');
var async = require('async');
var assert = require('assert');
var uuid = require('uuid/v5');
var ObjectID = require('mongodb').ObjectID;

// import environment secrets
if (process.env.PRODUCTION !== 'production') {
    // read secrets from '.env' file for local dev
    require('dotenv').config();
}

var globalNewsDoc;
const NEWS_CATEGORIES = [
    "general",
    "politics",
    "business",
    "entertainment",
    "health",
    "science",
    "sports",
    "technology"
]
const MAX_GLOBAL_STORIES = parseInt(process.env.MAX_GLOBAL_STORIES) || 300;

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
    // whenever we start, we repopulate news
    initGlobalDoc(populateNews);
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
    clearInterval(populateNewsBackgroundTimer);
    console.log("[INFO] Cleared news population interval timer.");
    process.kill(process.pid);
}


/** Cross Process Communication */
process.on("message", function(msg) {
    if (msg.command) {
        console.log("[INFO] Forked worker received command %s for user %s",
                    msg.command, msg.user._id);
        if (msg.command == "REFRESH_STORIES") {
            setImmediate(function(user) {
                initGlobalDoc(function callback() {
                    refreshStories(user, null);
                });
            }, msg.user);
        }
    } else {
        console.log("[WARNING] Forked worker received malformed message from server.");
        console.log("[WARNING] The messages should contain a 'command' field; got:", msg);
    }
});


/** Child process procedures */

// actual work for fetching stories
function refreshStories(user, callback) {
    var totalNewsAdded = 0;

    // loop through all news filters and seek matches for all returned stories
    for (var filterIdx = 0; filterIdx < user.newsFilters.length; filterIdx++) {
        var filter = user.newsFilters[filterIdx];
        var matchedNewStories = [];
        var existingStoryIDs = new Set(filter.newsStories.map(story => story.storyID));

        // we populate our new list by checking each new story in global document
        // against the keywords of the current filter for the user
        for (var i = 0; i < globalNewsDoc.newsStories.length; i++) {
            var story = globalNewsDoc.newsStories[i];

            // we avoid adding duplicates
            if (existingStoryIDs.has(story.storyID)) {
                continue;
            }

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
        // while avoiding duplicates, so as to limit the total number of stories
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
            console.log("[INFO] %d news in total are added for user %s", totalNewsAdded, user._id);
        } else {
            console.log("[WARNING] No news is added because user has no filters.");
        }
        if (callback) {
            return callback(err);
        }
    })
}

// populate master news list
function populateNews() {
    console.log("[INFO] Start populating news at:", Date.now());
    var articles = [];
    async.eachSeries(NEWS_CATEGORIES, function(keyword, callback) {
        https.get({
            host: "newsapi.org",
            path: "/v2/top-headlines?country=us&pageSize=20&category=" + keyword,
            headers: {
                "x-api-key": process.env.NEWS_API_KEY
            }
        }, function(res) {
            // get results
            var body = "";
            res.on("data", function(data) {
                body += data;
            });
            res.on('end', function() {
                if (res.statusCode != 200) {
                    console.log('[ERROR] Forked worker (%d) failed to fetch stories with keyword %s', res.statusCode, keyword);
                    return callback(new Error("Failed to fetch stories"));
                }
                try {
                    var response = JSON.parse(body);
                    if (response.status != "ok") {
                        console.log("[ERROR] Forked worker failed to fetch stories due to", response.message);
                        return callback(new Error("Failed to fetch stories"));
                    }
                    articles = articles.concat(response.articles);
                    return callback();
                } catch (err) {
                    console.log(err);
                    // return callback(new Error("[ERROR] Failed to parse NewsAPI response."));
                }
            })
        }).on("error", function(err) {
            console.log('[ERROR] Forked worker: failed to fetch stories with keyword %s', keyword);
            console.log('[ERROR] Forked worker: err encountered: ', err);
            return callback(err);
        })
    }, function(err) {
        if (err) {
            console.log(err);
            return;
        }
        var storyDocs = articles.map(story => getStoryDoc(story))
                                .filter(story => story != null);
        // save to global stories
        if (globalNewsDoc) {
            // don't add duplicate stories
            var existingStoryIDs = new Set(globalNewsDoc.newsStories.map(story => story.storyID));
            storyDocs = storyDocs.filter(story => !existingStoryIDs.has(story.storyID));
            // concatenate, while capping max number of stories
            storyDocs = storyDocs.concat(globalNewsDoc.newsStories)
                                 .slice(0, MAX_GLOBAL_STORIES);
        }
        db.collection.findOneAndUpdate({
            type: "GLOBALSTORY_TYPE",
        },{
            $set: {
                newsStories: storyDocs
            }
        }, {
            returnOriginal: false
        }, function(err, result) {
            if (err) {
                console.log('[ERROR] Forked worker failed to update for global story document:', err);
            } else if (!result) {
                console.log('[ERROR] Forked worker failed to update for global story document');
                console.log('[ERROR] Forked worker: global story document does not exists.');
            } else if (result.ok != 1) {
                console.log('[ERROR] Forked worker failed to update for global story document');
            } else {
                console.log('[INFO] Forked worker successfully populated news');
                globalNewsDoc = result.value;
                setImmediate(function() {
                    refreshStoriesForAllUsers();
                });
            }
        });
    })
}

function refreshStoriesForAllUsers() {
    var cursor = db.collection.find({ type: "USER_TYPE" });
    console.log("[INFO] Forked worker starts updating stories of all Users");
    var done = false;
    async.doWhilst(function(callback) {
        cursor.next(function(err, user) {
            if (err) {
                return callback(err);
            } else if (user) {
                refreshStories(user, function(err) {
                    return callback(err);
                })
            } else { // when user == null. we are done
                console.log("[INFO] Forked worker finished updating all Users.");
                done = true;
                callback();
            }
        });
    }, function() {
        return !done;
    }, function(err) {
        if (err) {
            console.log("[ERROR] Forked worker encountered error:", err);
        }
    });
}

/** Utility functions */

function initGlobalDoc(callback) {
    if (!globalNewsDoc) {
        db.collection.findOne({
            type: "GLOBALSTORY_TYPE"
        }, function(err, doc) {
            if (err) {
                console.log("[ERROR] Forked worker failed to fetch global story: ", err);
                if (callback) {
                    return callback(err);
                }
            } else {
                globalNewsDoc = doc;
                if (callback) {
                    return callback();
                }
            }
        })
    } else if (callback) {
        return callback();
    }
}

function storyMatchesKeyword(story, keyword) {
    var title   =  story.title.toLowerCase();
    var content =  story.contentSnippet.toLowerCase()
    return title.indexOf(keyword) >= 0 ||
           content.indexOf(keyword) >= 0;
}

function getStoryDoc(story) {
    // sanity check
    if (!story ||
        !story.title ||
        story.title.length == 0 ||
        !story.publishedAt ||
        story.publishedAt.length == 0 ||
        !story.url) {
        return null;
    }
    // create field
    var title = story.title;
    var contentSnippet = story.description;
    if (!contentSnippet) {
        if (story.content) {
            contentSnippet = story.content.slice(0, 700);
        } else {
            contentSnippet = "<no content found>";
        }
    }
    var date = story.publishedAt;
    var imageUrl = story.urlToImage;
    var link = story.url;
    if (!imageUrl || imageUrl.length > 500) {
        imageUrl = "";
    } else if (!link || link.length > 500) {
        link = "";
    }
    var source = story.source.name;
    var storyID = uuid(story.url, process.env.STORY_UUID_NAMESPAE);
    return {
        title: title,
        contentSnippet: contentSnippet,
        date: date,
        imageUrl: imageUrl,
        link: link,
        source: source,
        storyID: storyID
    }
}

/** Interval Procedures. */
// populate every 6 hours (6 hours * 60 min/hour * 60 secs/min * 1000 milliseconds/sec`)
var populateNewsBackgroundTimer = setInterval(populateNews, 6*60*60*1000);



