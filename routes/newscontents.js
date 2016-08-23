var express = require('express');
var router = express.Router();
var Newscontents = require('../models/newscontents');

router.get('/', function(req, res, next) {
  Newscontents.listNewscontents(function(err, results) {
    if (err) return next(err);
    res.send(results);
  });
});

router.get('/:ncid', function(req, res, next) {
  var ncid = req.params.ncid;

  Newscontents.findeNewscontents(ncid, function(err, results) {
    if (err) return next(err);
    res.send(results);
  });
});

module.exports = router;
