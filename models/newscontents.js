var dbPool = require('../models/common').dbPool;
var async = require('async');

module.exports.listNewscontents = function(callback) {
  // 오늘의 키워드와 해당하는 뉴스 기사를 가져오는 쿼리
  var sql = 'select k.word keyword, nc.id, nc.title, nc.content, nc.img_url, date_format(convert_tz(nc.ntime, "+00:00", "+09:00"), "%Y-%m-%d %H:%i:%s") ntime, nc.author ' +
            'from news_contents nc join keyword k on (k.id = nc.keyword_id) ' +
            'where k.ktime >= CURDATE()';

  dbPool.getConnection(function(err, conn) {
    if (err) return callback(err);
    conn.query(sql, [], function (err, results) {
      conn.release();
      if (err) return callback(err);
      // 결과 값이 없을 경우 404
      if (results.length === 0) return callback(null, false);
      // 응답으로 보낼 객체
      var nc = {};
      nc["results"] = []; // { results: [] }
      /*{
        "results": [
          {
            "keyword": "keyword1",
            "newscontens": [
              {
                "id": 1,
                "title": "제목",
                "content": "기사 내용",
                "img_url": "http://…/images/newscontents/20160821_id.bmp",
                "ntime": "기사 작성 시간",
                "author": "언론사"
              },
              { ... },
              { ... } // 각 키워드당 3개의 기사
            ]
          },
          { ... },
          ...
          { ... } // 10개의 키워드
        ]
      }*/
      // 위의 구조를 생성
      var i = 0;
      async.whilst(
        function() {
          return i < 10; // 10개의 키워드
        },
        function(callback) {
          nc.results[i] = {}; // { results: [{}, {}, ...] }
          nc.results[i].keyword = results[i * 3].keyword; // { results: [{ keyword: '...' }, { keyword: '...' }, ...] }
          nc.results[i].newscontens = []; // { results: [{ keyword: '...', newscontens: [] }, { keyword: '...', newscontens: [] }, ...] }
          for(var j = 0; j < 3; j++) { // 키워드 한개에 3개의 기사
            nc.results[i].newscontens.push({
              "id": results[(i * 3) + j].id,
              "title": results[(i * 3) + j].title,
              "content": results[(i * 3) + j].content,
              "img_url": results[(i * 3) + j].img_url || '',
              "ntime": results[(i * 3) + j].ntime,
              "author": results[(i * 3) + j].author
            });
          }
          i++;

          callback(null, nc);
        },
        function (err, nc) {
          if (err) return callback(err);
          callback(null, nc);
        }
      );
    });
  });
};

// 뉴스 컨텐츠 상세 조회
module.exports.findNewscontents = function(id, callback) {
  // id값으로 뉴스 컨텐츠 찾는 쿼리
  var sql = 'select title, content, img_url, link, date_format(convert_tz(ntime, "+00:00", "+09:00"), "%Y-%m-%d %H:%i:%s") ntime, author ' +
            'from news_contents ' +
            'where id = ?';

  dbPool.getConnection(function(err, conn) {
    if (err) return callback(err);

    conn.query(sql, [id], function (err, results) {
      conn.release();
      if (err) return callback(err);
      // 결과 값이 없을 경우 404
      if (results.length === 0) return callback(null, false);
      // nc 객체에 결과 값 담기
      var nc = {};
      nc.title = results[0].title;
      nc.content = results[0].content;
      nc.img_url = results[0].img_url || ''; // null이 허용된 속성
      nc.link = results[0].link;
      nc.ntime = results[0].ntime;
      nc.author = results[0].author;

      callback(null, nc);
    });
  });
};
