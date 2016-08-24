var express = require('express');
var router = express.Router();
var Notification = require('../models/notification');

router.get('/', function(req ,res, next) {
  var page = req.query.page;
  var count = req.query.count;

  Notification.listNotification(page, count, function(err, results) {
    if (err) return next(err);
    res.send(results);
  });
});

router.post('/', function(req ,res, next) {
  var type = req.body.type;
  var data_pk = req.body.data_pk;
  var ids = req.body.ids;

  Notification.createAndPush(type, data_pk, ids, function(err, result) {
    if (err) return next(err);
    res.send(result);
  });
});

module.exports = router;