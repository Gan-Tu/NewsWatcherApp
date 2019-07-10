/** A node module for all the validation schema. */
var joi = require('joi');


/*
 * Valid schema for password:
 * - 7 to 15 characters in length
 * - contain at least one numeric digit
 * - contain at least one uppercase letter
 * - contain at least one lowercase letter
 */
const PASSWORD = joi.string()
                    .regex(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{7,15}$/);

/*
 * Valid schema for email:
 * - email format
 * - 7 to 50 characters in length
 */
const EMAIL = joi.string().email().min(7).max(50);


/*
 * Valid schema for user names:
 * - contains only alphanumeric characters, whitespace, or -
 * - 3 to 50 characters in length
 */
const DISPLAY_NAME = joi.string()
                        .regex(/^[0-9a-zA-Z\s-]{3,50}$/);

/*
 * Valid schema for name of news filters
 * - contains only alphanumeric characters, whitespace, or -
 * - 1 to 30 characters
 */
const NEWS_FILTER = joi.string()
                       .regex(/^[-_a-zA-Z0-9]{1,30}$/);

/*
 * Valid schema for session logins:
 */
const SESSION_BODY = {
    email:      EMAIL.required(),
    password:   PASSWORD.required()
};

/*
 * Valid schema for creating new user profiles
 */
const CREATE_USER = {
    displayName:    DISPLAY_NAME.required(),
    email:          EMAIL.required(),
    password:       PASSWORD.required()
};


/*
 * Valid schema for updating existing user profiles:
 * - newsFilters: at most 5 filters per user supported
 */
const UPDATE_USER = {
    requireWIFI:    joi.boolean().required(),
    enableAlerts:   joi.boolean().required(),
    newsFilters:    joi.array().max(5).required()
}


/*
 * Valid schema for news filters
 * - keyWords: at most 10 keywords per filter supported
 */
const NEWSFILTER = {
    name:               NEWS_FILTER.required(),
    keyWords:           joi.array()
                           .max(10)
                           .items(joi.string().trim().max(20))
                           .required(),
    enableAlert:        joi.boolean(),
    alertFrequency:     joi.number().min(0),
    enableAutoDelete:   joi.boolean(),
    deleteTime:         joi.date(),
    timeOfLastScan:     joi.date(),
    newsStories:        joi.array(),
    keywordsStr:        joi.string().min(1).max(100)
}


/*
 * Valid schema for stories
 */
const NEWS_STORY = {
    contentSnippet: joi.string().max(200).required(),
    date:           joi.date().required(),
    hours:          joi.string().max(20),
    imageUrl:       joi.string().max(300).required(),
    keep:           joi.boolean().required(),
    link:           joi.string().max(300).required(),
    source:         joi.string().max(50).required(),
    storyID:        joi.string().max(100).required(),
    title:          joi.string().max(200).required()
}

// exports
module.exports.PASSWORD = PASSWORD;
module.exports.EMAIL = EMAIL;
module.exports.DISPLAY_NAME = DISPLAY_NAME;
module.exports.NEWS_FILTER = NEWS_FILTER;
module.exports.SESSION_BODY = SESSION_BODY;
module.exports.CREATE_USER = CREATE_USER;
module.exports.UPDATE_USER = UPDATE_USER;
module.exports.NEWSFILTER = NEWSFILTER;
module.exports.NEWS_STORY = NEWS_STORY;
