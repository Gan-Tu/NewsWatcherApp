/** Reset database for the News Watcher App. */
"use strict";

// import environment secrets
if (process.env.PRODUCTION !== 'production') {
    // read secrets from '.env' file for local dev
    require('dotenv').config();
}

/** Database Connection */
const MongoClient = require('mongodb').MongoClient;
const DATABASE_NAME = "newswatcherdb";
const COLLECTION_NAME = "newswatcher";

var dbClient;

// connect to database
MongoClient.connect(process.env.MONGODB_CONNECT_URL, function(err, client) {
    if (err) {
        console.log("[ERROR] Cannot connect to database");
        return;
    }
    dbClient = client;
    var db = client.db(DATABASE_NAME);
    // drop any existing database
    db.dropCollection(COLLECTION_NAME, function(err, ok) {
        if (err || !ok) {
            console.log("[ERROR] Error encountered when dropping collection", err);
        }
        console.log("[INFO] Successfully dropped collection:", COLLECTION_NAME);
        // create collection
        db.createCollection(COLLECTION_NAME, function(err, collection) {
            if (err || !collection) {
                console.log("[ERROR] Failed to create collection %s", COLLECTION_NAME);
                if (err) {
                    console.log("[ERROR] -- error message:", err);
                }
                return;
            }
            console.log("[INFO] Successfully created collection:", COLLECTION_NAME);
            // create index
            collection.createIndex({
                email: 1
            }, {
                background : true,
                partialFilterExpression: {
                    email: {
                        $exists: true
                    }
                }
            }, function(err, result) {
                if (err || !result) {
                    console.log("[ERROR] Failed to create index");
                    if (err) {
                        console.log("[ERROR] -- error message:", err);
                    }
                    return;
                }
                console.log("[INFO] Successfully created index");
                // leave process
                interrupt_cleanup();
            });
        })
    })
});

// gracefully close the database connections
process.on('SIGINT', interrupt_cleanup);
process.on('SIGUSR2', interrupt_cleanup);
process.on('uncaughtException', interrupt_cleanup);
function interrupt_cleanup(err) {
    if (err) {
        console.log("[ERROR] caught: ", err);
    }
    console.log('[INFO] Cleaning up before worker termination.');
    if (dbClient) {
        dbClient.close();
        console.log("[INFO] ... Database connection gracefully closed.");
    }
    process.exit(0);
}
