/** Seed database for the News Watcher App. */

var faker = require('faker');
var assert = require('assert');

// seeding configuration
const FAKE_USER_COUNT = 15;
const FAKE_GLOBAL_STORIE_COUNT = 5;
const FAKE_FILTER_PER_USER = 3;
const FAKE_KEYWORDS_PER_FILTER = 2;
const FAKE_STORIES_PER_FILTER = 2;
const FAKE_PASSWORD_HASH = // "PasswordExample123"
    "$2a$10$MDcxiCpABabSt/wGRILSSONMfRqn1dP5zATePeJeHzDIXDuTxAlaq";

// existing fake document
const GAN_DOC  =
    createUserDocument("Gan Tu", "tugan0329@gmail.com",
            // "19970329Tugan."
            "$2a$10$DuekMNuB5V/.HU/.ZnUC0OpPx4hBFCcLZi9t.7a4A34I/wTPWNbN2");
const TEST_DOC  =
    createUserDocument("Test User", "test@example.com", FAKE_PASSWORD_HASH);
const TECH_DOC =  {
    title:          "Technology companies",
    contentSnippet:  "Apple Microsoft IBM Amazon Google Intel",
    date:           Date.now(),
    imageUrl:       "http://example.com/image.jpg",
    link:           "http://example.com/url",
    source:         "test example",
    storyID:        "a6967247d753493089e65d5a"
}

// fake keywords generated
var keywords = []

// import environment secrets
if (process.env.PRODUCTION !== 'production') {
    // read secrets from '.env' file for local dev
    require('dotenv').config();
}

/** Database Connection */
var db = {}
const MongoClient = require('mongodb').MongoClient;

// connect to database
MongoClient.connect(process.env.MONGODB_CONNECT_URL, function(err, client) {
    assert.equal(null, err);
    db.client = client;
    db.collection = client.db('newswatcherdb').collection('newswatcher');
    console.log("[INFO] Successfully connected to MongoDB database.");
    // seed database
    seed_global_doc(function() {
        seed_example_global_stories(function() {
            seed_example_users(function() {
                interrupt_cleanup();
            });
        });
    });
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
    if (db && db.client) {
        db.client.close();
        console.log("[INFO] ... Database connection gracefully closed.");
    }
    process.exit(0);
}


/** Seed Global story document */
function seed_global_doc(callback) {
    console.log("[INFO] Generating the global story document.");
    db.collection.findOne({
        type: "GLOBALSTORY_TYPE"
    }, function(err, result) {
        if (err) {
            console.log('[INFO] Failed to check for global story document.');
        } else if (!result) {
            db.collection.insertOne({
                type: "GLOBALSTORY_TYPE",
                newsStories: []
            }, function(err) {
                if (err) {
                    console.log('[INFO] Failed to create global story document.');
                } else {
                    console.log('[INFO] Global story document created.');
                }
                if (callback) {
                    callback();
                }
            });
        } else {
            console.log('[INFO] Global story document already exists.');
            if (callback) {
                callback();
            }
        }
    })
}

/** Seed database with example home stories. */
function seed_example_global_stories(callback) {
    console.log("[INFO] Generating all the fake global stories.");
    var stories = [TECH_DOC];
    for (var i = 0; i < FAKE_GLOBAL_STORIE_COUNT; i++) {
        stories.push(fakeStory());
    }
    console.log("[INFO] Writing all fake global stories to MongoDB.");
    db.collection.findOneAndUpdate({
        type: "GLOBALSTORY_TYPE"
    }, {
        $set: {
            newsStories: stories
        }
    }, function(err) {
        if (err) {
            console.log("[ERROR] Failed to write fake global stories:", err);
        } else {
            console.log("[INFO] All fake global stories committed.");
        }
        console.log("[INFO] Creating keywords from global stories");
        for (var j = 0; j < stories.length; j++) {
            keywords = keywords.concat(stories[j].title.split(" "));
        }
        keywords = new Set(keywords);
        keywords.delete('');
        keywords = Array.from(keywords);
        console.log("[INFO] Keywords extracted from global stories.");
        if (callback) {
            callback();
        }
    });
}

/** Seed database with example users. */
function seed_example_users(callback) {
    console.log("[INFO] Generating all the fake user profiles.");
    var users = [
        GAN_DOC,
        TEST_DOC
    ];
    for (var i = 0; i < FAKE_USER_COUNT; i++) {
        users.push(fakeUserDocument());
    }
    console.log("[INFO] Writing all fake user profiles to MongoDB.");
    db.collection.insertMany(users, function(err) {
        if (err) {
            console.log("[ERROR] Failed to seed fake user profiles:", err);
        } else {
            console.log("[INFO] All fake user profiles committed.");
        }
        if (callback) {
            callback();
        }
    });
}


/** Create actual user document */
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

/** Create a fake user */
function fakeUserDocument() {
    return {
        type: 'USER_TYPE',
        displayName: faker.name.findName(),
        email: faker.internet.email().toLowerCase(),
        passwordHash: FAKE_PASSWORD_HASH,
        date: faker.date.past(),
        completed: false,
        settings: {
            requireWIFI: true,
            enableAlerts: false
        },
        savedStories: [],
        newsFilters: randArray(fakeNewsFilter, FAKE_FILTER_PER_USER)
    }
}

/** Create a fake news filter */
function fakeNewsFilter() {
    var keyWords = randArray(faker.random.word,
                             FAKE_KEYWORDS_PER_FILTER);
    keyWords = keyWords.concat([ keywords[randint(0, keywords.length)] ]);
    return {
        "name":  faker.random.words(),
        "keyWords": keyWords,
        "enableAlert": false,
        "alertFrequency": 0,
        "enableAutoDelete": false,
        "deleteTime": 0,
        "timeOfLastScan": 0,
        "newsStories": randArray(fakeStory,
                                 FAKE_STORIES_PER_FILTER)
    };
}

/** Create a fake story. */
function fakeStory() {
    var storyID = faker.random.uuid().replace(/-/g, "").slice(0, 24);
    return {
        title:          faker.random.words(),
        contentSnippet: faker.lorem.paragraph(),
        date:           Date.parse(faker.date.past()),
        imageUrl:       faker.internet.url(),
        link:           faker.internet.url(),
        source:         faker.random.words(),
        storyID:        storyID
    }
}

/** Return a random integer */
function randint(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}

/** Return an array of N elements, each generated by function FN. */
function randArray(fn, n) {
    var result = []
    for (var i = 0; i < n; i++) {
        result.push(fn());
    }
    return result;
}





