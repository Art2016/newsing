var dbPool = require('../common/dbpool');
var async = require('async');
var path = require('path');
var url = require('url');

// 뉴스 컨텐츠 검색
module.exports.findNewscontents = function(data, callback) {
  // 해당 검색어로 뉴스 컨텐츠 찾는 쿼리
  var sql = 'select id, title, author, date_format(convert_tz(ntime, "+00:00", "+09:00"), "%Y-%m-%d %H:%i:%s") ntime ' +
            'from news_contents ' +
            'where title like ? ' +
            'order by ntime desc, id desc ' +
            'limit ?, ?';

  dbPool.logStatus();
  dbPool.getConnection(function(err, conn) {
    if (err) return callback(err);
    conn.query(sql, [data.word, data.count * (data.page - 1), data.count], function (err, results) {
      conn.release();
      dbPool.logStatus();
      if (err) return callback(err);
      // 검색 결과를 담을 객체
      var newscontents = {};
      newscontents['results'] = [];
      // 값이 없을 경우 빈 배열
      if (results.length === 0) return callback(null, newscontents);

      async.each(results, function(item, done) {
        newscontents.results.push({
          id: item.id,
          title: item.title,
          author: item.author,
          ntime: item.ntime
        });
        done(null);
      }, function(err) {
        if (err) callback(err);
        callback(null, newscontents);
      });
    });
  });
};

// 사용자 검색
module.exports.findUsers = function(data, callback) {
  // 해당 검색어로 사용자 찾는 쿼리
  var sql = 'select u.id, u.pf_path, u.name, u.aboutme, case when f.user_id_o is not null then 1 else 0 end flag ' +
            'from user u left join (select user_id_o from follow where user_id = ?) f on (u.id = f.user_id_o) ' + // 팔로우 여부 체크
            'where u.name like ? and u.id != ? ' + // 검색에서 나를 제외
            'order by u.name, u.followers desc, u.scrapings desc ' +
            'limit ?, ?';

  dbPool.logStatus();
  dbPool.getConnection(function(err, conn) {
    if (err) return callback(err);

    conn.query(sql, [data.uid, data.word, data.uid, data.count * (data.page - 1), data.count], function (err, results) {
      conn.release();
      dbPool.logStatus();
      if (err) return callback(err);
      // 검색 결과를 담을 객체
      var users = {};
      users['results'] = [];
      // 값이 없을 경우 빈 배열
      if (results.length === 0) return callback(null, users);

      async.each(results, function(item, done) {
        var pf_url = '';
        // http로 시작하면 페이스북 사진
        if(item.pf_path.match(/http.+/i)) {
          pf_url = item.pf_path;
        } else { // 파일에 접근할 url 생성
          var filename = path.basename(item.pf_path);
          pf_url = url.resolve(process.env.SERVER_HOST, '/images/profile/' + filename);
        }
        users.results.push({
          id: item.id,
          pf_url: pf_url,
          name: item.name,
          aboutme: item.aboutme,
          flag: (item.flag === 1) ? true : false
        });
        done(null);
      }, function(err) {
        if (err) callback(err);
        callback(null, users);
      });
    });
  });
};

// 태그 검색
module.exports.findTags = function(data, callback) {
  // 해당 검색어로 태그 찾는 쿼리
  var sql = 'select id, tag from hashtag where tag like ?';

  dbPool.logStatus();
  dbPool.getConnection(function(err, conn) {
    if (err) return callback(err);
    conn.query(sql, [data.word, data.count * (data.page - 1), data.count], function (err, results) {
      conn.release();
      dbPool.logStatus();
      if (err) return callback(err);
      // 검색 결과를 담을 객체
      var tags = {};
      tags['results'] = [];
      // 값이 없을 경우 빈 배열
      if (results.length === 0) return callback(null, tags);

      async.each(results, function(item, done) {
        tags.results.push({
          id: item.id,
          tag: item.tag
        });
        done(null);
      }, function(err) {
        if (err) callback(err);
        callback(null, tags);
      });
    });
  });
};

// 스크랩 검색
module.exports.findScraps = function(data, callback) {
  // 해당 검색어로 스크랩 찾는 쿼리
  var sql = 'select s.id, s.title, nc.title nc_title, nc.img_url nc_img_url, nc.author nc_author, nc.ntime nc_ntime, s.favorite_cnt, case when f.scrap_id is not null then 1 else 0 end favorite ' +
            'from scrap s join news_contents nc on (s.news_contents_id = nc.id) ' +
                          'join category c on (c.id = s.category_id) ' +
                          'left join (select scrap_id from favorite where user_id = ?) f on (s.id = f.scrap_id) ' +
            'where s.title like ? and s.locked = 0 and c.user_id != ? ' +
            'order by s.dtime desc, nc.id desc, s.id desc ' +
            'limit ?, ?';

  dbPool.logStatus();
  dbPool.getConnection(function(err, conn) {
    if (err) return callback(err);
    conn.query(sql, [data.uid, data.word, data.uid, data.count * (data.page - 1), data.count], function (err, results) {
      conn.release();
      dbPool.logStatus();
      if (err) return callback(err);
      // 검색 결과를 담을 객체
      var scraps = {};
      scraps['results'] = [];
      // 값이 없을 경우 빈 배열
      if (results.length === 0) return callback(null, scraps);

      async.each(results, function(item, done) {
        scraps.results.push({
          id: item.id,
          title: item.title,
          nc_title: item.nc_title,
          nc_img_url: item.nc_img_url,
          nc_author: item.nc_author,
          nc_ntime: item.nc_ntime,
          favorite_cnt: item.favorite_cnt,
          favorite: (item.favorite === 1) ? true : false
        });
        done(null);
      }, function(err) {
        if (err) callback(err);
        callback(null, scraps);
      });
    });
  });
};
