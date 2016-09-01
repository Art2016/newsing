var express = require('express');
var router = express.Router();
var Scrap = require('../models/scrap');
var path = require('path');
var formidable = require('formidable');

// 스크랩 생성
router.post('/', function(req, res, next) {
  var form = new formidable.IncomingForm();
  // fields를 배열로 받기 위한 설정
  var formFields = {};
  // tag[0] = '의자', tag[1] = '러그'
  // tag[] = '의자', tag[] = '러그'
  // tag = '의자', tag = '러그'
  form.on('field', function(name, value) {
    function makeFormFields(prop, val) {
      if (!formFields[prop]) {
        formFields[prop] = val;
      } else {
        if (formFields[prop] instanceof Array) { // 배열일 경우
          formFields[prop].push(val);
        } else { // 배열이 아닐 경우
          var tmp = formFields[prop];
          formFields[prop] = [];
          formFields[prop].push(tmp);
          formFields[prop].push(val);
        }
      }
    }
    var re1 = /\[\]/;
    var re2 = /\[\d+\]/;
    if (name.match(re1)) {
      name = name.replace(re1, '');
    } else if (name.match(/\[\d+\]/)) {
      name = name.replace(re2, '');
    }
    makeFormFields(name, value);
  });
  form.uploadDir = path.join(__dirname, '../uploads/images');
  form.keepExtensions = true;
  form.multiples = false;
  form.parse(req, function(err, fields, files) {
    if(err) return next(err);
    // scrap 객체에 매개변수 담기
    var scrap = {};
    scrap.uid = req.user.id;
    scrap.cid = parseInt(fields.cid);
    scrap.ncid = parseInt(fields.ncid);
    scrap.title = fields.title;
    scrap.content = fields.content;
    // 스크랩 이미지를 안 넣었을 때
    if (files.img) scrap.pf = files.img.path;
    else scrap.pf = null;
    scrap.locked = fields.locked;
    scrap.tags = formFields['tags']; // 태그 배열

    Scrap.createScrap(scrap, function(err, result) {
      if (err) return next(err);
      res.send(result);
    });
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
    if (!results) return res.status('404').send({
      "error": "스크랩 조회에 실패하였습니다."
    });
    res.send(results);
  });
});

// TODO: 스크랩 삭제
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
    scrap.content = fields.content;
    scrap.img = files.img;
    scrap.locked  = fields.locked;
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
