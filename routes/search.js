var express = require('express');
var router = express.Router();
var Search = require('../models/search');
var logger = require('../common/logger');

router.get('/', function(req, res, next) {
  var data = {};
  data.uid = req.user.id;
  data.word = '%' + req.query.word + '%';
  data.page = parseInt(req.query.page);
  data.count = parseInt(req.query.count);

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
      res.status('404').send({
          "error": "올바른 검색이 아닙니다."
      });
  }
});

module.exports = router;
