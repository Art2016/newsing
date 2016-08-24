var express = require('express');
var router = express.Router();
var Search = require('../models/search');

router.get('/', function(req, res, next) {
  var data = {};
  data.word = req.query.word;
  data.page = req.query.page;
  data.count = req.query.count;

  var target = parseInt(req.query.target);
  switch (target) {
    case 1:
      Search.findNewscontents(data, function(err, results) {
        if (err) return next(err);
        res.send(results);
      });
      break;
    case 2:
      Search.findUsers(data, function(err, results) {
        if (err) return next(err);
        res.send(results);
      });
      break;
    case 3:
      Search.findTags(data, function(err, results) {
        if (err) return next(err);
        res.send(results);
      });
      break;
    case 4:
      Search.findScraps(data, function(err, results) {
        if (err) return next(err);
        res.send(results);
      });
      break;
    default:
      res.send('다른 값이 왔을 때 처리');
  }
});

module.exports = router;