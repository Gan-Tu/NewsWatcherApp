/** A node module for all the validation schema. */
var joi = require('joi');


/*
 * Valid schema for password:
 * - 7 to 20 characters in length
 * - contain at least one numeric digit
 * - contain at least one uppercase letter
 * - contain at least one lowercase letter
 */
const PASSWORD = joi.string()
                    .regex(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{7,20}$/);

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
const NEWSFILTER_NAME = joi.string()
                       .regex(/^[-_a-zA-Z0-9]{1,30}$/);

/*
 * Valid schema for comments
 */
const COMMENT = joi.string().trim().max(250).empty('');


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
    name:               NEWSFILTER_NAME.required(),
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
    contentSnippet: joi.string().max(700).required(),
    date:           joi.date().required(),
    imageUrl:       joi.string().required(),
    link:           joi.string().required(),
    source:         joi.string().max(100).required(),
    storyID:        joi.string().max(100).required(),
    title:          joi.string().max(300).required()
}

/*
 * Valid schema for sharing a story
 */
const SHARED_STORY = {
    story: joi.object(NEWS_STORY).required(),
    comment: COMMENT
};

/*
 * Valid schema for posting a comment
 */
const POST_COMMENT = {
    comment: COMMENT.required()
}


// exports
module.exports.PASSWORD = PASSWORD;
module.exports.EMAIL = EMAIL;
module.exports.DISPLAY_NAME = DISPLAY_NAME;
module.exports.COMMENT = COMMENT;
module.exports.NEWSFILTER_NAME = NEWSFILTER_NAME;
module.exports.SESSION_BODY = SESSION_BODY;
module.exports.CREATE_USER = CREATE_USER;
module.exports.UPDATE_USER = UPDATE_USER;
module.exports.NEWSFILTER = NEWSFILTER;
module.exports.NEWS_STORY = NEWS_STORY;
module.exports.SHARED_STORY = SHARED_STORY;
module.exports.POST_COMMENT = POST_COMMENT;

