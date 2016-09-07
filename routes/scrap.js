var express = require('express');
var router = express.Router();
var Scrap = require('../models/scrap');
var path = require('path');
var formidable = require('formidable');
var logger = require('../common/logger');

// 스크랩 생성
router.post('/', function(req, res, next) {
  console.log(req.headers['content-type']);
  // scrap 객체에 매개변수 담기
  var scrap = {};
  scrap.uid = req.user.id;
  scrap.cid = parseInt(req.body.cid);
  scrap.ncid = parseInt(req.body.ncid);
  scrap.title = req.body.title;
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
    if (err) return next(err);
    res.send(result);
  });
});

// 스크랩 목록
router.get('/', function(req ,res, next) {
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
  var scrap = {};
  scrap.id = parseInt(req.params.sid);
  scrap.title = req.body.title;
  scrap.content = req.body.content;
  scrap.locked  = req.body.locked;
  scrap.tags = [];
  var tags = req.body.tags || ''; // 값이 없을 경우 오류 방지
  if (tags instanceof Array) { // 배열일 경우
    for (var i = 0; i < tags.length; i++) {
      if (tags[i].trim() !== '') scrap.tags.push(tags[i].trim());
    }
  } else {
    if (tags.trim() !== '') scrap.tags.push(tags.trim());
  } // scrap.tags는 빈 배열 또는 원소 하나 이상인 배열이다

  Scrap.updateScrap(scrap, function(err, result) {
    if (err) return next(err);
    if (!result) return res.status('404').send({
      "error": "스크랩 수정을 실패하였습니다."
    });
    res.send(result);
  });
});

// 스크랩 상세 조회
router.get('/:sid', function(req, res, next) {
  var sid = parseInt(req.params.sid);
  var uid = req.user.id;

  Scrap.findScrap(sid, uid, function(err, result) {
    if (err) return next(err);
    // if (!result) return res.status('404').send({
    //   "error": "해당 스크랩이 없습니다."
    // });
    if (result === '403') return res.status(result).send({
      "error": "잘못된 접근입니다."
    });
    res.send({
      result: result
    });
  });
});

// '좋아요' 이모티콘 생성
router.post('/:sid/favorites', function(req, res, next) {
  var sid = parseInt(req.params.sid);
  var uid = req.user.id;

  Scrap.createFavorite(sid, uid, function(err, result) {
    if (err) return next(err);
    res.send(result);
  });
});

// '좋아요' 이모티콘 해제
router.delete('/:sid/favorites/me', function(req, res, next) {
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
