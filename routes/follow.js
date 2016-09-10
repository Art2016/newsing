var express = require('express');
var router = express.Router();
var Follow = require('../models/follow');
var logger = require('../common/logger');
var sendMessage = require('./common').sendMessage;

// 팔로잉 / 팔로워 목록
router.get('/', function(req ,res, next) {
  logger.log('debug', 'content-type: %s', req.headers['content-type']);
  logger.log('debug', '%s %s://%s%s', req.method, req.protocol, req.headers['host'], req.originalUrl);
  logger.log('debug', 'query: %j', req.query, {});

  var data = {};
  data.id = req.user.id;
  data.direction = req.query.direction;
  if (data.direction !== 'to' && data.direction !== 'from') return next(); // 잘못된 경로일 경우
  data.page = parseInt(req.query.page);
  data.count = parseInt(req.query.count);

  Follow.listFollow(data, function(err, results) {
    if (err) return next(err);
    res.send(results);
  });
});

// 팔로우 생성
router.post('/', function(req, res, next) {
  logger.log('debug', 'content-type: %s', req.headers['content-type']);
  logger.log('debug', '%s %s://%s%s', req.method, req.protocol, req.headers['host'], req.originalUrl);
  logger.log('debug', 'query: %j', req.query, {});
  logger.log('debug', 'body: %j', req.body, {});

  var id = req.user.id;
  var id_o = req.body.ofid;
  var name = req.user.name;

  Follow.createFollow(id, id_o, name, function(err, result) {
    if (err) {
      return (err.errno === 1062) ? res.status('404').send({ "error": err.message }) // Duplicate
      : (err.errno === 1452) ? res.status('404').send({ "error": err.message }) : next(err); // foreign key constraint fails
    }
    // 알림 설정이 true일 때
    if (req.user.nt_f === 1) {
      sendMessage(result.messageObj, result.tokens, function(err, response) {
        if (err) return logger.log('error', 'ERROR: %j', err, {});
        logger.log('info', 'FCM send info: %j', response, {});
      });
    }

    res.send({ "results": "팔로우를 하였습니다." });
  });
});

// 팔로우 해제
router.delete('/:ofid', function(req, res, next) {
  logger.log('debug', 'content-type: %s', req.headers['content-type']);
  logger.log('debug', '%s %s://%s%s', req.method, req.protocol, req.headers['host'], req.originalUrl);
  logger.log('debug', 'query: %j', req.query, {});
  logger.log('debug', 'ofid: %s', req.params.ofid);

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
