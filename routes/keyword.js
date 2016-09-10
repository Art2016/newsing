var express = require('express');
var router = express.Router();
var Keyword = require('../models/keyword');
var logger = require('../common/logger');

// 키워드 목록
router.get('/', function(req ,res, next) {
  logger.log('debug', 'content-type: %s', req.headers['content-type']);
  logger.log('debug', '%s %s://%s%s', req.method, req.protocol, req.headers['host'], req.originalUrl);
  logger.log('debug', 'query: %j', req.query, {});

  Keyword.listKeyword(function(err, results) {
    if (err) return next(err);
    res.send(results);
  });
});

module.exports = router;
