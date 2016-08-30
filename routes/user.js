var express = require('express');
var router = express.Router();
var User = require('../models/user');
var path = require('path');
var formidable = require('formidable');

// 사용자 조회
router.get('/:uid', function(req, res, next) {
  var uid = '';
  // me일 경우 세션에 저장된 자기 아이디
  if (req.params.uid === 'me') uid = req.user.id;
  else uid = req.params.uid;

  User.findUser(uid, function(err, result) {
    if (err) return next(err);
    if (!result) return res.status('404').send({
      "error": "해당 사용자가 없습니다."
    });
    res.send(result);
  });
});

// 나의 사용자 정보 변경
router.put('/me', function(req, res, next) {
  var uid = req.user.id;

  var form = new formidable.IncomingForm();
  form.uploadDir = path.join(__dirname, '../uploads/images');
  form.keepExtensions = true;
  form.multiples = false;
  form.parse(req, function(err, fields, files) {
    if(err) return next(err);
    var user = {};
    user.id = uid;
    user.name = fields.name;
    if(files.pf) user.pf = files.pf.path;
    else user.pf = null;
    user.aboutme = fields.aboutme;

    User.updateUser(user, function(err, result) {
      if (err) return next(err);
      if (!result) return res.status('404').send({
        "error": "수정을 실패하였습니다."
      });
      res.send(result);
    });
  });
});

// 카테고리 조회
router.get('/:uid/categories', function(req, res, next) {
  var uid = '';
  if (req.params.uid === 'me') uid = req.user.id;
  else uid = req.params.uid;

  var data = {};
  data.uid = uid;
  data.usage = req.query.usage;
  data.page = parseInt(req.query.page) || 1;
  data.count = parseInt(req.query.count) || 20;
  User.listCategory(data, function(err, results) {
    if (err) return next(err);
    if (!results) return res.status('404').send({
      "error": "카테고리를 불러오는데 실패하였습니다."
    });
    res.send(results);
  });
});

// 나의 카테고리 생성
router.post('/me/categories', function(req, res, next) {
  var uid = req.user.id;

  var form = new formidable.IncomingForm();
  form.uploadDir = path.join(__dirname, '../uploads/images');
  form.keepExtensions = true;
  form.multiples = false;
  form.parse(req, function(err, fields, files) {
    if(err) return next(err);
    var category = {};
    category.uid = uid;
    category.name = fields.name;
    // 카테고리 이미지를 안 넣었을 때 디폴트 처리
    if (files.img) category.pf = files.img.path;
    else category.pf = 'default';
    category.private = fields.private;

    User.createCategory(category, function(err, result) {
      if (err) return next(err);
      if (!result) return res.status('404').send({
        "error": "카테고리 생성을 실패하였습니다."
      });
      res.send(result);
    });
  });
});

// 카테고리 변경
router.put('/me/categories/:cid', function(req, res, next) {
  var cid = parseInt(req.params.cid);

  var form = new formidable.IncomingForm();
  form.uploadDir = path.join(__dirname, '../uploads/images');
  form.keepExtensions = true;
  form.multiples = false;
  form.parse(req, function(err, fields, files) {
    if(err) return next(err);
    var category = {};
    category.cid = cid;
    category.name = fields.name;
    if (files.img) category.img_path = files.img.path;
    else category.img_path = null;
    category.private = fields.private;

    User.updateCategory(category, function(err, result) {
      if (err) return next(err);
      if (!result) return res.status('404').send({
        "error": "카테고리 변경을 실패하였습니다."
      });
      res.send(result);
    });
  });
});

router.delete('/me/categories/:cid', function(req, res, next) {
  var cid = parseInt(req.params.cid);

  User.removeCategory(cid, function(err, result) {
    if (err) return next(err);
    if (!result) return res.status('404').send({
      "error": "카테고리 삭제를 실패하였습니다"
    });
    res.send(result);
  });
});

module.exports = router;
