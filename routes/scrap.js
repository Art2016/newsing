var express = require('express');
var router = express.Router();
var Scrap = require('../models/scrap');
var path = require('path');
var formidable = require('formidable');
var logger = require('../common/logger');
var sendMessage = require('./common').sendMessage;

// 스크랩 생성
router.post('/', function(req, res, next) {
  logger.log('debug', 'content-type: %s', req.headers['content-type']);
  logger.log('debug', '%s %s://%s%s', req.method, req.protocol, req.headers['host'], req.originalUrl);
  logger.log('debug', 'query: %j', req.query, {});
  logger.log('debug', 'body: %j', req.body, {});

  // scrap 객체에 매개변수 담기
  var scrap = {};
  scrap.uid = req.user.id;
  scrap.uname = req.user.name;
  scrap.cid = parseInt(req.body.cid);
  scrap.ncid = parseInt(req.body.ncid);
  scrap.title = req.body.title.trim();
  scrap.content = req.body.content;
  scrap.locked = req.body.locked;
  scrap.tags = [];
  var tags = req.body.tags || ''; // 값이 없을 경우 오류 방지
  if (tags instanceof Array) { // 배열일 경우
    for (var i = 0; i < tags.length; i++) {
      if (tags[i].trim() !== '') scrap.tags.push(tags[i].trim());
    }
  } else {
    if (tags.trim() !== '') scrap.tags.push(tags.trim());
  } // scrap.tags는 빈 배열 또는 원소 하나 이상인 배열이다

  Scrap.createScrap(scrap, function(err, result) {
    if (err) {
      // foreign key constraint fails
      return (err.errno === 1452) ? res.status('404').send({ "error": err.message }) : next(err);
    }
    if (!result) {
      return res.status('404').send({
        "error": "스크랩 생성에 실패하였습니다."
      });
    }
    if (result === '403') {
      return res.status(result).send({
        "error": "잘못된 접근입니다."
      });
    }

    // 알림 보내기
    sendMessage(result.messageObj, result.tokens, function(err, response) {
      if (err) return logger.log('error', 'ERROR: %j', err, {});
      logger.log('info', 'FCM send info: %j', response, {});
    });

    res.send({ "result": "스크랩을 완료하였습니다." });
  });
});

// 스크랩 목록
router.get('/', function(req ,res, next) {
  logger.log('debug', 'content-type: %s', req.headers['content-type']);
  logger.log('debug', '%s %s://%s%s', req.method, req.protocol, req.headers['host'], req.originalUrl);
  logger.log('debug', 'query: %j', req.query, {});

  // data 객체에 매개변수 담기
  var data = {};
  data.uid = req.user.id;
  data.cid = parseInt(req.query.category);
  data.page = parseInt(req.query.page) || 1;
  data.count = parseInt(req.query.count) || 20;

  Scrap.listScrap(data, function(err, results) {
    if (err) return next(err);
    // if (!results) return res.status('404').send({
    //   "error": "스크랩 조회에 실패하였습니다."
    // });
    res.send(results);
  });
});

// 스크랩 삭제
router.delete('/:sid', function(req ,res, next) {
  logger.log('debug', 'content-type: %s', req.headers['content-type']);
  logger.log('debug', '%s %s://%s%s', req.method, req.protocol, req.headers['host'], req.originalUrl);
  logger.log('debug', 'query: %j', req.query, {});
  logger.log('debug', 'sid: %s', req.params.sid);

  var sid = parseInt(req.params.sid);
  var uid = req.user.id;

  Scrap.removeScrap(sid, uid, function(err, result) {
    if (err) return next(err);
    if (!result) return res.status('404').send({
      "error": "스크랩 삭제를 실패하였습니다."
    });
    res.send(result);
  });
});

// 스크랩 변경
router.put('/:sid', function(req, res, next) {
  logger.log('debug', 'content-type: %s', req.headers['content-type']);
  logger.log('debug', '%s %s://%s%s', req.method, req.protocol, req.headers['host'], req.originalUrl);
  logger.log('debug', 'query: %j', req.query, {});
  logger.log('debug', 'sid: %s', req.params.sid);
  logger.log('debug', 'body: %j', req.body, {});

  var action = req.query.action;

  var scrap = {};
  scrap.id = parseInt(req.params.sid);

  if (action === 'udscrap') {
    var data = {};
    if (req.body.title) data.title = req.body.title.trim();
    if (req.body.content) data.content = req.body.content;
    if (req.body.locked) data.locked = req.body.locked;
    scrap.data = data;

    scrap.tags = [];
    var tags = req.body.tags || ''; // 값이 없을 경우 오류 방지
    if (tags instanceof Array) { // 배열일 경우
      for (var i = 0; i < tags.length; i++) {
        if (tags[i].trim() !== '') scrap.tags.push(tags[i].trim());
      }
    } else {
      if (tags.trim() !== '') scrap.tags.push(tags.trim());
    } // scrap.tags는 빈 배열 또는 원소 하나 이상인 배열이다

    Scrap.updateScrap(scrap, function (err, result) {
      if (err) return next(err);
      if (!result) return res.status('404').send({
        "error": "스크랩 수정을 실패하였습니다."
      });
      res.send(result);
    });
  } else if (action === 'mvcategory') {
    var uid = req.user.id;
    var cid = parseInt(req.body.cid);

    Scrap.moveCategory(scrap.id, cid, uid, function(err, result) {
      if (err) return next(err);

      res.send(result);
    });
  } else {
    next();
  }
});

// 스크랩 상세 조회
router.get('/:sid', function(req, res, next) {
  logger.log('debug', 'content-type: %s', req.headers['content-type']);
  logger.log('debug', '%s %s://%s%s', req.method, req.protocol, req.headers['host'], req.originalUrl);
  logger.log('debug', 'query: %j', req.query, {});
  logger.log('debug', 'sid: %s', req.params.sid);

  var sid = parseInt(req.params.sid);
  var uid = req.user.id;

  Scrap.findScrap(sid, uid, function(err, result) {
    if (err) return next(err);
    // if (!result) return res.status('404').send({
    //   "error": "해당 스크랩이 없습니다."
    // });
    if (result === '403') return res.send({ "result": "비공개 스크랩입니다." });
    res.send({
      result: result
    });
  });
});

// '좋아요' 이모티콘 생성
router.post('/:sid/favorites', function(req, res, next) {
  logger.log('debug', 'content-type: %s', req.headers['content-type']);
  logger.log('debug', '%s %s://%s%s', req.method, req.protocol, req.headers['host'], req.originalUrl);
  logger.log('debug', 'query: %j', req.query, {});
  logger.log('debug', 'sid: %s', req.params.sid);

  var sid = parseInt(req.params.sid);
  var uid = req.user.id;
  var uname = req.user.name;

  Scrap.createFavorite(sid, uid, uname, function(err, result) {
    if (err) {
      return (err.errno === 1062) ? res.status('404').send({ "error": err.message }) // Duplicate
      : (err.errno === 1452) ? res.status('404').send({ "error": err.message }) : next(err); // foreign key constraint fails
    }

    // 알림 보내기
    sendMessage(result.messageObj, result.tokens, function(err, response) {
      if (err) return logger.log('error', 'FCM ERROR: %j', err, {});
      logger.log('info', 'FCM send info: %j', response, {});
    });

    res.send({ "result": "'좋아요' 이모티콘이 활성화되었습니다." });
  });
});

// '좋아요' 이모티콘 해제
router.delete('/:sid/favorites/me', function(req, res, next) {
  logger.log('debug', 'content-type: %s', req.headers['content-type']);
  logger.log('debug', '%s %s://%s%s', req.method, req.protocol, req.headers['host'], req.originalUrl);
  logger.log('debug', 'query: %j', req.query, {});
  logger.log('debug', 'sid: %s', req.params.sid);

  var sid = parseInt(req.params.sid);
  var uid = req.user.id;

  Scrap.removeFavorite(sid, uid, function(err, result) {
    if (err) return next(err);
    if (!result) return res.status('404').send({
      "error": "실패하였습니다."
    });
    res.send(result);
  });
});

module.exports = router;
