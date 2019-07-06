"use strict";
var express = require('express');
var router = express.Router();

// placeholder router
router.get('/', function (req, res, next) {
    res.send('Hello! This is a placeholder for: users');
});

module.exports = router;