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
        if (msg.command == "REFRESH_STORIES") {
            setImmediate(function(doc) {
                refreshStoriesMSG(doc, null)
            }, msg.doc);
        }
    } else {
        console.log("[WARNING] Forked worker received malformed message from server.");
        console.log("[WARNING] The messages should contain a 'command' field; got:", msg);
    }
});


/** Child process procedures */

// ensure the global news document is initialized
// before `fetchStories` is called
function refreshStories(doc, callback) {
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
                return fetchStories(doc, callback);
            }
        })
    } else {
        return fetchStories(doc, callback);
    }
}

// actual work for fetching stories
function fetchStories(doc, callback) {

}

