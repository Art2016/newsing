var express = require('express');
var router = express.Router();
var Newscontents = require('../models/newscontents');
var logger = require('../common/logger');

// 뉴스 컨텐츠 조회
router.get('/', function(req, res, next) {
  logger.log('debug', 'content-type: %s', req.headers['content-type']);
  logger.log('debug', '%s %s://%s%s', req.method, req.protocol, req.headers['host'], req.originalUrl);
  logger.log('debug', 'query: %j', req.query, {});

  // 키워드 1개당 3개의 기사 X 10 -> 페이징 처리가 없어도 됨...
  Newscontents.listNewscontents(function(err, results) {
    if (err) return next(err);
    // if (!results) return res.status('404').send({
    //   "error": "뉴스 컨텐츠를 받아오는데 실패하였습니다."
    // });
    res.send(results);
  });
});

// 뉴스 컨텐츠 상세 조회
router.get('/:ncid', function(req, res, next) {
  logger.log('debug', 'content-type: %s', req.headers['content-type']);
  logger.log('debug', '%s %s://%s%s', req.method, req.protocol, req.headers['host'], req.originalUrl);
  logger.log('debug', 'query: %j', req.query, {});
  logger.log('debug', 'ncid: %s', req.params.ncid);

  var ncid = req.params.ncid; // 뉴스 컨텐츠 아이디

  Newscontents.findNewscontents(ncid, function(err, result) {
    if (err) return next(err);
    // if (!result) return res.status('404').send({
    //   "error": "해당 뉴스 컨텐츠가 없습니다."
    // });
    res.send({
      result: result
    });
  });
});

module.exports = router;
