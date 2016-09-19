var dbPool = require('../common/dbpool');
var async = require('async');

// 뉴스 컨텐츠 생성
module.exports.createNewscontents = function(articles, callback) {
  var sql = 'insert into news_contents(title, content, img_url, link, author, ntime) values(?, ?, ?, ?, ?, ?)';

  dbPool.logStatus();
  // 데이터들을 병렬로 저장
  async.each(articles, function(article, done) {
    dbPool.getConnection(function(err, conn) {
      if (err) return done(err);
      conn.query(sql, [
        article.title,
        article.content,
        article.img_url,
        article.link,
        article.author,
        article.ntime
      ], function (err) {
        conn.release();
        dbPool.logStatus();
        if (err) return done(err);
        done(null);
      });
    });
  }, function(err) {
    if (err) return callback(err);
    callback(null, { message: 'news_contents is completed save' });
  });

};

// 뉴스 컨텐츠 목록
module.exports.listNewscontents = function(callback) {
  var sql_select_keyword = 'select rank, word from keyword order by rank';

  var sql_select_news_contents = 'select id, title, content, img_url, date_format(convert_tz(ntime, "+00:00", "+09:00"), "%Y-%m-%d %H:%i:%s") ntime, author ' +
                                 'from news_contents ' +
                                 'where match(title, content) against(?) and ntime >= (CURDATE() - INTERVAL ? DAY) ' +
                                 'order by ntime desc, id desc ' +
                                 'limit 3';

  dbPool.logStatus();
  dbPool.getConnection(function(err, conn) {
    if (err) return callback(err);
    conn.query(sql_select_keyword, [], function (err, results) {
      if (err) return callback(err);

      // 응답으로 보낼 객체
      var nc = {};
      nc["results"] = []; // { results: [] }

      // select하여 나온 10개의 키워드에 대한 검색 결과들
      async.each(results, function(item, done) {
        nc.results[item.rank] = {}; // { results: [{}, {}, ...] }
        nc.results[item.rank].keyword = item.word; // { results: [{ keyword: '...' }, { keyword: '...' }, ...] }
        nc.results[item.rank].newscontens = []; // { results: [{ keyword: '...', newscontens: [] }, { keyword: '...', newscontens: [] }, ...] }

        conn.query(sql_select_news_contents, [item.word, 3], function (err, articles) {
          if (err) return done(err);

          for(var i = 0; i < 3; i++) { // 키워드 한개에 3개의 기사
            if (articles[i]) {
              nc.results[item.rank].newscontens.push({
                "id": articles[i].id,
                "title": articles[i].title,
                "content": articles[i].content,
                "img_url": articles[i].img_url,
                "ntime": articles[i].ntime,
                "author": articles[i].author
              });
            } else {
              nc.results[item.rank].newscontens.push({
                "id": -1,
                "title": '정보 없음',
                "content": '정보 없음',
                "img_url": '',
                "ntime": '정보 없음',
                "author": '정보 없음'
              });
            }
          }

          done(null);
        });
      }, function(err) {
        conn.release();
        dbPool.logStatus();
        if (err) return callback(err);
        callback(null, nc);
      });
    });
  });
};

// 뉴스 컨텐츠 상세 조회
module.exports.findNewscontents = function(id, callback) {
  // id값으로 뉴스 컨텐츠 찾는 쿼리
  var sql = 'select title, content, img_url, link, date_format(convert_tz(ntime, "+00:00", "+09:00"), "%Y-%m-%d %H:%i:%s") ntime, author ' +
            'from news_contents ' +
            'where id = ?';

  dbPool.logStatus();
  dbPool.getConnection(function(err, conn) {
    if (err) return callback(err);

    conn.query(sql, [id], function (err, results) {
      conn.release();
      dbPool.logStatus();
      if (err) return callback(err);
      // nc 객체에 결과 값 담기
      var nc = {};
      // 결과 값이 없을 경우 빈 객체
      if (results.length === 0) return callback(null, nc);

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

// 뉴스 컨텐츠의 제목과 내용을 검색
// 제목과 내용은 합쳐서 반환
module.exports.findTitleAndContent = function(day, callback) {
  var sql = 'select title, content from news_contents where ntime >= (CURDATE() - INTERVAL ? DAY)';

  dbPool.logStatus();
  dbPool.getConnection(function(err, conn) {
    if (err) return callback(err);

    conn.query(sql, [day], function (err, results) {
      conn.release();
      dbPool.logStatus();
      if (err) return callback(err);

      async.map(results, function(item, done) {
        var article = item.title + '^' + item.content;
        done(null, article);
      }, function(err, articles) {
        if (err) return callback(err);
        callback(null, articles);
      });
    });
  });
}
