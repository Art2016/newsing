var express = require('express');
var router = express.Router();
var Keyword = require('../models/keyword');
var Newscontents = require('../models/newscontents');
var async = require('async');
var TwitterKoreanText = require('../lib/twtkrjs');
var logger = require('../common/logger');

var processor = new TwitterKoreanText({
  stemmer: false,      // (optional default: true)
  normalizer: false,   // (optional default: true)
  spamfilter: true     // (optional default: false)
});

// 키워드 목록
router.get('/', function(req ,res, next) {
  logger.log('debug', 'debug: %s', 'start');

  async.waterfall([
    createDocument,
    extractWord,
    countWord,
    countWordToDoc,
    calculationTFIDF
  ], function (err, results) {
    logger.log('debug', 'debug: %s', 'end');
    // results.sort(function (a, b) {
    //   return a.cnt < b.cnt ? 1 : (a.cnt > b.cnt ? -1 : 0);
    // });
    res.send(results);
  });

  // 문서 집합 만들기
  function createDocument(next) {
    logger.log('debug', 'debug: %s', 'createDocument');
    // feed(urls[0], function (err, articles) { // 해당 url을 feed하여 데이터를 가져옴
    //   console.log(articles);
    //   var doc = []; // 문서 집합 배열
    //
    //   for (var i = 0; i < articles.length; i++) {
    //     doc.push(articles[i].title + '^' + articles[i].content); // 제목과 내용을 합쳐 push
    //   }
    //   next(null, doc);
    // });
    var day = 3; // 몇일 전의 데이터까지 가져올지 설정

    Newscontents.findTitleAndContent(day, function(err, results) {
      if (err) return next(err);
      next(null, results);
    });
  }

  // 형태소 분석을 통한 명사 추출
  function extractWord(doc, next) {
    logger.log('debug', 'debug: %s', 'extractWord');
    var wordArr = [];

    async.forEachOf(doc, function (item, index, callback) {
      processor.tokenize(item, function (err, words) {
        if (err) return callback(err);
        wordArr[index] = [];

        async.each(words, function (item, done) {
          if(item.pos === 'Noun') {
              wordArr[index].push(item.text);
          }
          done(null);
        }, function (err) {
          if (err) return callback(err);
          callback(null);
        });
      });
    }, function (err) {
      if (err) return next(err);
      next(null, wordArr);
    });
  }

  // 카운팅 하기 { text: '단어', tf: 3 }
  function countWord(wordArr, next) {
    logger.log('debug', 'debug: %s', 'countWord');
    var results = [];

    async.forEachOf(wordArr, function (words, index, callback) {
      results[index] = [];

      async.each(words, function(word, done) {
        var key = results[index].findIndex(function(v) {
          return v.text === word
        });

        if (key === -1) {
          results[index].push({ text: word, tf: 1 });
        } else {
          results[index][key].tf++;
        }

        done(null);
      }, function(err) {
        if (err) callback(err);
        callback(null);
      });
    }, function (err) {
      if (err) return next(err);

      var candidate_words = [];

      for(var i = 0; i < results.length; i++) {
        candidate_words[i] = [];
        for(var j = 0; j < results[i].length; j++) {
          if (results[i][j].tf !== 1) {
            candidate_words[i].push(results[i][j]);
          }
        }
      }

      next(null, candidate_words);
    });
  }

  // 단어가 포함된 문서 수 추가 { text: '단어', tf: 3, df:2 }
  function countWordToDoc(cw, next) {
    logger.log('debug', 'debug: %s', 'countWordToDoc');
    var total_tf = 0;

    async.each(cw, function (doc, cb1) {

      async.each(doc, function (item, cb2) {
        total_tf += item.tf;
        item.df = 0;

        for(var i = 0; i < cw.length; i++) {
          var b = cw[i].findIndex(function(v) {
            return v.text === item.text;
          });

          if (b !== -1) item.df++;
        }

        cb2(null);
      }, function (err) {
        if (err) return cb1(err);
        cb1(null);
      });
    }, function (err) {
      if (err) return next(err);
      next(null, cw, total_tf);
    });
  }

  function calculationTFIDF(cw, total_tf, next) {
    logger.log('debug', 'debug: %s', 'calculationTFIDF');
    var each_doc_keyword = [];

    async.each(cw, function(doc, cb1) {

      async.each(doc, function(item, cb2) {
        var tf = /*(0.5 + (0.5 * item.tf / total_tf));*/ item.tf * 1 + item.df * 0;
        var idf = (Math.log(cw.length / item.df) / Math.log(10));

        item.tf_idf = tf * idf;
        cb2(null);
      }, function(err) {
        if (err) return cb1(err);

        doc.sort(function(a, b) {
          var x = a.tf_idf, y = b.tf_idf;
          return x < y ? 1 : (x > y ? -1 : 0);
        });

        var keyword = '';
        keyword += doc[0].text;
        keyword += (doc[1]) ? ' ' + doc[1].text : '';
        keyword += (doc[2]) ? ' ' + doc[2].text : '';
        keyword += (doc[3]) ? ' ' + doc[3].text : '';
        keyword += (doc[4]) ? ' ' + doc[4].text : '';
        each_doc_keyword.push(keyword);

        cb1(null);
      });
    }, function(err) {
      if (err) return next(err);
      next(null, each_doc_keyword);
    });
  }
});

module.exports = router;
