var express = require('express');
var router = express.Router();
var Follow = require('../models/follow');
var logger = require('../common/logger');

// 팔로잉 / 팔로워 목록
router.get('/', function(req ,res, next) {
  var direction = req.query.direction;
  var data = {};
  data.id = req.user.id;
  data.page = parseInt(req.query.page);
  data.count = parseInt(req.query.count);

  if (direction === 'to') {
    Follow.listFollowing(data, function(err, results) {
      if (err) return next(err);
      res.send(results);
    });
  } else if (direction === 'from') {
    Follow.listFollower(data, function(err, results) {
      if (err) return next(err);
      res.send(results);
    });
  }
});

router.post('/', function(req, res, next) {
  var id = req.user.id;
  var id_o = req.body.ofid;

  Follow.createFollow(id, id_o, function(err, result) {
    if (err) return next(err);
    res.send(result);
  });
});

router.delete('/:ofid', function(req, res, next) {
  var id = req.user.id;
  var id_o = req.params.ofid;

  Follow.removeFollow(id, id_o, function(err, result) {
    if (err) return next(err);
    if (!result) return res.status('404').send({
      "error": "팔로우를 해제하는데 실패하였습니다."
    });
    res.send(result);
  });
});

module.exports = router;
