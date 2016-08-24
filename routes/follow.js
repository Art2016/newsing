var express = require('express');
var router = express.Router();
var Follow = require('../models/follow');

router.get('/', function(req ,res, next) {
  var direction = req.query.direction;
  var page = req.query.page;
  var count = req.query.count;

  if (direction === 'to') {
    Follow.listFollowing(page, count, function(err, results) {
      if (err) return next(err);
      res.send(results);
    });
  } else if (direction === 'from') {
    Follow.listFollower(page, count, function(err, results) {
      if (err) return next(err);
      res.send(results);
    });
  }
});

router.post('/', function(req, res, next) {
  var id = req.user.id;
  var id_o = req.body.uid;

  Follow.createFollow(id, id_o, function(err, result) {
    if (err) return next(err);
    res.send(result);
  });
});

router.delete('/:uid', function(req, res, next) {
  var uid = req.params.uid;

  Follow.removeFollow(uid, function(err, result) {
    if (err) return next(err);
    res.send(result);
  });
});

module.exports = router;
