var express = require('express');
var router = express.Router();
var Keyword = require('../models/keyword');

router.get('/', function(req ,res, next) {
  Keyword.listKeyword(function(err, results) {
    if (err) return next(err);
    res.send(results);
  });
});

module.exports = router;