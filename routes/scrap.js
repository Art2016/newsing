var express = require('express');
var router = express.Router();
var Scrap = require('../models/scrap');
var path = require('path');
var formidable = require('formidable');

router.post('/', function(req, res, next) {
  var form = new formidable.IncomingForm();
  //form.uploadDir = path.join(__dirname, '../uploads/images/' + uid);
  form.keepExtensions = true;
  form.multiples = false;
  form.parse(req, function(err, fields, files) {
    if(err) return next(err);
    var scrap = {};
    scrap.cid = fields.cid;
    scrap.ncid = fields.ncid;
    scrap.title = fields.title;
    scrap.contents = fields.contents;
    scrap.img = files.img;
    scrap.private  = fields.private;
    scrap.tags  = fields.tags;

    Scrap.createScrap(scrap, function(err, result) {
      if (err) return next(err);
      res.send(result);
    });
  });
});

router.get('/', function(req ,res, next) {
  var data = {};
  data.category = req.query.category;
  data.page = req.query.page;
  data.count = req.query.count;

  Scrap.listScrap(data, function(err, results) {
    if (err) return next(err);
    res.send(results);
  });
});

router.delete('/:sid', function(req ,res, next) {
  var sid = req.params.sid;

  Scrap.removeScrap(sid, function(err, result) {
    if (err) return next(err);
    res.send(result);
  });
});

router.put('/:sid', function(req, res, next) {
  var form = new formidable.IncomingForm();
  //form.uploadDir = path.join(__dirname, '../uploads/images/' + uid);
  form.keepExtensions = true;
  form.multiples = false;
  form.parse(req, function(err, fields, files) {
    if(err) return next(err);
    var scrap = {};
    scrap.sid = req.params.sid;
    scrap.title = fields.title;
    scrap.contents = fields.contents;
    scrap.img = files.img;
    scrap.private  = fields.private;
    scrap.tags  = fields.tags;

    Scrap.updateScrap(scrap, function(err, result) {
      if (err) return next(err);
      res.send(result);
    });
  });
});

router.get('/:sid', function(req, res, next) {
  var sid = req.query.sid;

  Scrap.findScrap(sid, function(err, result) {
    if (err) return next(err);
    res.send(result);
  });
});

router.post('/:sid/favorites', function(req, res, next) {
  var uid = req.params.uid;
  var sid = req.params.sid;

  Scrap.createFavorites(uid, sid, function(err, result) {
    if (err) return next(err);
    res.send(result);
  });
});

router.delete('/:sid/favorites/me', function(req, res, next) {
  var uid = req.user.id;
  var sid = req.query.sid;

  Scrap.removeFavorites(uid, sid, function(err, result) {
    if (err) return next(err);
    res.send(result);
  });
});

module.exports = router;