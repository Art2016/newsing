var express = require('express');
var router = express.Router();
var Notification = require('../models/notification');
var logger = require('../common/logger');

router.get('/', function(req ,res, next) {
  logger.log('debug', 'content-type: %s', req.headers['content-type']);
  logger.log('debug', '%s %s://%s%s', req.method, req.protocol, req.headers['host'], req.originalUrl);
  logger.log('debug', 'query: %j', req.query, {});

  var uid = req.user.id;
  var page = parseInt(req.query.page);
  var count = parseInt(req.query.count);

  Notification.listNotification(uid, page, count, function(err, results) {
    if (err) return next(err);
    res.send({ "results": results });
  });
});

module.exports = router;
