var express = require('express');
var router = express.Router();
var User = require('../models/user');

router.get('/:uid', function(req, res, next) {
  var uid = '';
  if (req.params.uid === 'me') uid = req.user.id;
  else uid = req.params.uid;

  User.findUser(uid, function(err, results) {

  });
});

module.exports = router;
