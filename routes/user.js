var express = require('express');
var router = express.Router();
var User = require('../models/user');
var path = require('path');
var formidable = require('formidable');
var logger = require('../common/logger');

// 사용자 조회
router.get('/:uid', function(req, res, next) {
  logger.log('debug', 'content-type: %s', req.headers['content-type']);
  logger.log('debug', '%s %s://%s%s', req.method, req.protocol, req.headers['host'], req.originalUrl);
  logger.log('debug', 'query: %j', req.query, {});
  logger.log('debug', 'uid: %s', req.params.uid);

  var uid = req.user.id;
  // 자기자신인지 판단
  var ouid = '';
  // me일 경우 현재 세션의 아이디 사용
  if (req.params.uid !== 'me') {
    ouid = req.params.uid;
  }

  User.findUser(uid, ouid, function(err, result) {
    if (err) return next(err);
    if (!result) return res.status('404').send({
      "error": "해당 사용자가 없습니다."
    });
    res.send({
      result: result
    });
  });
});

// 나의 사용자 정보 변경
router.put('/:uid', function(req, res, next) {
  logger.log('debug', 'content-type: %s', req.headers['content-type']);
  logger.log('debug', '%s %s://%s%s', req.method, req.protocol, req.headers['host'], req.originalUrl);
  logger.log('debug', 'query: %j', req.query, {});
  logger.log('debug', 'uid: %s', req.params.uid);
  logger.log('debug', 'body: %j', req.body, {});

  if (req.params.uid !== 'me') return next();
  var uid = req.user.id;

  var action = req.query.action;
  // 사용자 알림 정보 변경
  if (action === 'fs' || action === 's' || action === 'f') {
    var state = req.body.nt_state;
    if (state !== '1' || state !== '0') return next(); // 1과 0 이외의 값은 404

    var nt = {};
    nt['nt_' + action] = req.body.nt_state; // update set 값에 넣을 객체 생성

    User.updateNotification(uid, nt, function(err, result) {
      if (err) return next(err);
      if (!result) return res.status('404').send({
        "error": "설정을 실패하였습니다."
      });
      res.send(result);
    });
  } else if (action === 'no') {
    // 사용자 정보 변경
    var form = new formidable.IncomingForm();
    form.uploadDir = path.join(__dirname, '../uploads/images/profile');
    form.keepExtensions = true;
    form.multiples = false;
    form.parse(req, function(err, fields, files) {
      logger.log('debug', 'fields: %j', fields, {});
      logger.log('debug', 'files: %j', files, {});

      if(err) return next(err);
      // user 객체에 매개변수를 담기
      var user = {};
      if (fields.name) user.name = fields.name;
      if (files.pf) user.pf_path = files.pf.path;
      if (fields.aboutme) user.aboutme = fields.aboutme;

      User.updateUser(uid, user, function(err, result) {
        if (err) return next(err);
        if (!result) return res.status('404').send({
          "error": "수정을 실패하였습니다."
        });
        res.send(result);
      });
    });
  } else {
    next();
  }
});

// 카테고리 목록
router.get('/:uid/categories', function(req, res, next) {
  logger.log('debug', 'content-type: %s', req.headers['content-type']);
  logger.log('debug', '%s %s://%s%s', req.method, req.protocol, req.headers['host'], req.originalUrl);
  logger.log('debug', 'query: %j', req.query, {});
  logger.log('debug', 'uid: %s', req.params.uid);

  var uid = '';
  var me = false; // 비공개 여부에 따른 카테고리 목록을 위한 체크 변수
  // me일 경우 현재 세션의 아이디 사용
  if (req.params.uid === 'me') {
    me = true;
    uid = req.user.id;
  } else {
    // 동적 라우팅 파라미터로 내 아이디를 넣었을 경우도 처리
    me = (req.params.uid === req.user.id) ? true : false;
    uid = req.params.uid;
  }
  // date 객체에 매개변수를 담기
  var data = {};
  data.uid = uid;
  data.me = me;
  data.usage = req.query.usage; // "scrap" or "profile"
  data.page = parseInt(req.query.page) || 1;
  data.count = parseInt(req.query.count) || 20;

  User.listCategory(data, function(err, results) {
    if (err) return next(err);
    if (!results) return res.status('404').send({
      "error": "카테고리를 불러오는데 실패하였습니다."
    });
    res.send({
      results: results
    });
  });
});

// 나의 카테고리 생성
router.post('/:uid/categories', function(req, res, next) {
  logger.log('debug', 'content-type: %s', req.headers['content-type']);
  logger.log('debug', '%s %s://%s%s', req.method, req.protocol, req.headers['host'], req.originalUrl);
  logger.log('debug', 'query: %j', req.query, {});
  logger.log('debug', 'uid: %s', req.params.uid);

  if (req.params.uid !== 'me') return next();
  var uid = req.user.id;

  var form = new formidable.IncomingForm();
  form.uploadDir = path.join(__dirname, '../uploads/images/category');
  form.keepExtensions = true;
  form.multiples = false;
  form.parse(req, function(err, fields, files) {
    logger.log('debug', 'fields: %j', fields, {});
    logger.log('debug', 'files: %j', files, {});

    if(err) return next(err);
    // category 객체에 매개변수 담기
    var category = {};
    category.uid = uid;
    category.name = fields.name;
    // 카테고리 이미지를 안 넣었을 때 디폴트 처리
    if (files.img) category.img = files.img.path;
    else category.img = 'default'; // 안드로이드에 저장된 디폴트 이미지 적용
    category.locked = fields.locked;

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
router.put('/:uid/categories/:cid', function(req, res, next) {
  logger.log('debug', 'content-type: %s', req.headers['content-type']);
  logger.log('debug', '%s %s://%s%s', req.method, req.protocol, req.headers['host'], req.originalUrl);
  logger.log('debug', 'query: %j', req.query, {});
  logger.log('debug', 'uid: %s', req.params.uid);

  if (req.params.uid !== 'me') return next();
  var cid = parseInt(req.params.cid);
  var uid = req.user.id;

  var form = new formidable.IncomingForm();
  form.uploadDir = path.join(__dirname, '../uploads/images/category');
  form.keepExtensions = true;
  form.multiples = false;
  form.parse(req, function(err, fields, files) {
    logger.log('debug', 'fields: %j', fields, {});
    logger.log('debug', 'files: %j', files, {});

    if(err) return next(err);
    // category 객체에 매개변수 담기
    var category = {};
    if (fields.name) category.name = fields.name.trim();
    if (files.img) category.img_path = files.img.path;
    if (fields.locked) category.locked = fields.locked;

    User.updateCategory(cid, uid, category, function(err, result) {
      if (err) return next(err);
      if (!result) return res.status('404').send({
        "error": "카테고리 변경을 실패하였습니다."
      });
      if (result === '403') return res.status(result).send({
        "error": "잘못된 접근입니다."
      });
      res.send(result);
    });
  });
});

// 카테고리 삭제
router.delete('/:uid/categories/:cid', function(req, res, next) {
  logger.log('debug', 'content-type: %s', req.headers['content-type']);
  logger.log('debug', '%s %s://%s%s', req.method, req.protocol, req.headers['host'], req.originalUrl);
  logger.log('debug', 'query: %j', req.query, {});
  logger.log('debug', 'uid: %s', req.params.uid);

  if (req.params.uid !== 'me') return next();
  var cid = parseInt(req.params.cid);
  var uid = req.user.id;

  User.removeCategory(cid, uid, function(err, result) {
    if (err) return next(err);
    if (!result) return res.status('404').send({
      "error": "카테고리 삭제를 실패하였습니다"
    });
    if (result === '403') return res.status(result).send({
      "error": "잘못된 접근입니다."
    });
    res.send(result);
  });
});

module.exports = router;
