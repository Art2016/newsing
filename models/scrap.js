var dbPool = require('../models/common').dbPool;
var async = require('async');

// 스크랩 생성
module.exports.createScrap = function(scrap, callback) {
  // scrap을 생성
  var sql_inserte_scrap = 'insert into scrap(category_id, news_contents_id, title, content, img_path, locked) ' +
                          'values(?, ?, ?, ?, ?, ?)';
  // 해당 해쉬태그가 존재하는지 검색
  var sql_select_hashtag = 'select id from hashtag where tag = ?';
  // 없다면 해쉬태그 생성
  var sql_insert_hashtag = 'insert into hashtag(tag) values(?)';
  // scrap_id와 hashtag_id로 scrap_tag 생성
  var sql_insert_scrap_tag = 'insert into scrap_tag(scrap_id, hashtag_id) values(?, ?)';
  // 스크랩 생성 시 사용자의 스크랩 수 1 증가
  var sql_update_scrapings = 'update user set scrapings = scrapings + 1 where id = ?';

  dbPool.getConnection(function(err, conn) {
    if (err) return callback(err);

    conn.beginTransaction(function (err) {
      if (err) {
        conn.release();
        return callback(err);
      }
      // scrap과 hashtag를 저장하고 나온 insertId(또는 원래 태그 id)로 scrap_tag 생성
      async.parallel([createScrap, createHashtag, increaseScrapins], function (err, results) {
        if (err) {
          return conn.rollback(function () {
            conn.release();
            callback(err);
          });
        }
        // 해쉬태그가 있을 때
        if (results[1]) {
          // scrap_tag 테이블에 넘어온 id값을 insert
          // results[0] => scrap_id / results[1] => [hashtag_id]
          async.each(results[1], function (hashtag_id, cb) {
            conn.query(sql_insert_scrap_tag, [results[0], hashtag_id], function (err, result) {
              if (err) return cb(err);
              cb(null)
            });
          }, function (err) {
            if (err) {
              return conn.rollback(function () {
                conn.release();
                callback(err);
              });
            }
            conn.commit(function () {
              conn.release();
              callback(null, {
                "result": "스크랩을 완료하였습니다."
              });
            });
          });
        } else { // 해쉬태그가 없으면 바로 커밋!!
          conn.commit(function () {
            conn.release();
            callback(null, {
              "result": "스크랩을 완료하였습니다."
            });
          });
        }
      });
    });
    // scrap 생성
    function createScrap(done) {
      conn.query(sql_inserte_scrap,
        [scrap.cid, scrap.ncid, scrap.title, scrap.content, scrap.pf, scrap.locked],
        function(err, result) {
          if (err) return done(err);
          // scrap_tag insert를 위한 id
          done(null, result.insertId);
      });
    }
    // hashtag 생성
    function createHashtag(done) {
      // 해쉬태그 여부 검사
      if (scrap.tags) {
        var hashtag_id = [];

        async.each(scrap.tags, function (tag, cb) {
          // 해당 태그가 있는지 검색
          conn.query(sql_select_hashtag, [tag], function (err, results) {
            if (err) return cb(err);
            // 태그가 있으면 찾아온 태그 아이디를 배열에 넣기
            if (results.length !== 0) {
              hashtag_id.push(results[0].id);
              cb(null);
            } else { // 없으면 insert 후 insertId를 배열에 넣기
              conn.query(sql_insert_hashtag, [tag], function (err, result) {
                if (err) return cb(err);
                hashtag_id.push(result.insertId);
                cb(null);
              });
            }
          });
        }, function (err) {
          if (err) done(err);
          done(null, hashtag_id);
        });
      } else { // 해쉬태그가 없을 때 false 반환
        done(null, false);
      }
    }
    // scrapings 증가
    function increaseScrapins(done) {
      conn.query(sql_update_scrapings, [scrap.uid], function(err, result) {
        if (err) return done(err);
        done(null);
      });
    }
  });
};

// 스크랩 목록
module.exports.listScrap = function(data, callback) {
  // 20개의 스크랩을 최신순으로 찾는 쿼리
  var sql_select_scrap = 'select s.id, s.title, nc.title nc_title, nc.img_url nc_img_url, nc.author nc_author, convert_tz(nc.ntime, "+00:00", "+09:00") nc_ntime, locked, favorite_cnt ' +
                         'from scrap s join news_contents nc on (nc.id = s.news_contents_id) ' +
                         'where s.category_id = ? ' +
                         'order by ntime desc ' +
                         'limit ?, ?';
  // 좋아요 이모티콘 활성화 여부 검색
  var sql_select_favorite = 'select * from favorite where user_id = ? and scrap_id = ?';

  dbPool.getConnection(function(err, conn) {
    if (err) return callback(err);

    var scraps = {}; // 스크랩 내용을 담을 객체
    // 스크랩 내용을 검색한 다음 해당 id로 favorite 활성화 여부 검사하여 scraps 객체에 추가
    async.series([findScrapList, checkFavorite], function(err) {
      conn.release();
      if (err) return callback(err);
      callback(null, scraps);
    });
    // 스크랩 내용 검색
    function findScrapList(next) {
      conn.query(sql_select_scrap, [data.cid, data.count * (data.page - 1), data.count], function (err, results) {
        if (err) return next(err);
        // 결과 값이 없을 경우 404
        if (results.length === 0) return callback(null, false);
        // 배열에 검색된 내용을 담기
        scraps.results = [];

        async.each(results, function(item, done) {
          scraps.results.push({
            id: item.id,
            title: item.title,
            nc_title: item.nc_title,
            nc_img_url: item.nc_img_url,
            nc_author: item.nc_author,
            nc_ntime: item.nc_ntime,
            locked: item.locked,
            favorite_cnt: item.favorite_cnt
          });

          done(null);
        }, function (err) {
          if (err) return next(err);
          next(null);
        });
      });
    }
    // favorite 활성화 여부 검사
    function checkFavorite(next) {
      async.forEachOf(scraps.results, function (scrap, index, done) { // scraps.results에 넣기 위해 index 필요
        conn.query(sql_select_favorite, [data.uid, scrap.id], function (err, results) {
          if (err) return done(err);
          // 검색된 결과가 없으면 false로 비활성화 표시
          if (results.length === 0) {
            scraps.results[index].favorite = false;
          } else { // true는 활성화 표시
            scraps.results[index].favorite = true;
          }
          
          done(null);
        });
      }, function (err) {
        if (err) return next(err);
        next(null);
      });
    }
  });
};

// TODO: 스크랩 삭제
module.exports.removeScrap = function(id, callback) {
  // TODO: id에 해당하는 스크랩을 삭제하는 쿼리
  // TODO: 스크랩 이미지가 있을 경우 삭제 -> 트랜잭션
  callback(null, {
    "result": "스크랩 삭제가 완료되었습니다."
  });
};

module.exports.updateScrap = function(scrap, callback) {
  callback(null, {
    "result": "스크랩 수정이 완료되었습니다."
  });
};

module.exports.findScrap = function(id, callback) {
  callback(null, {
    "result": {
      "title": "제목" + id,
      "nc_title": "금융권 클라우드 도입, 핀테크가 이끈다",
      "nc_contents": "지난해 9월 클라우드 컴퓨팅 발전법이 시행된 이후 지지부진했던 금융권 클라우드 서비스 도입 활성화에 핀테크가 마중물 역할을 하게 됐다. NH농협은행은 지난해 말부터 좋은 아이디어를 가진 핀테크 기업들에게 자사 금융API를 열어줘 서비스를 보다 쉽고 빠르게 연동시킬 수 있게 돕는 NH 핀테크 오픈플랫폼을 설립, 운영 중이다.",
      "nc_img_url": "http://.../images/newscontents/20160821_id.bmp",
      "nc_link": "http://www.zdnet.co.kr/news/news_view.asp?artice_id=20160823161828",
      "contents": "스크랩 내용",
      "img_url": "http://.../images/scraps/20160821_id.bmp",
      "favorite_cnt": 1,
      "favorite": true,
      "tags": ["tag1", "tag2", "tag3"]
    }
  });
};

module.exports.createFavorites = function(uid, sid, callback) {
  callback(null, {
    "result": "\"좋아요\" 이모티콘이 활성화되었습니다."
  });
};

module.exports.removeFavorites = function(uid, sid, callback) {
  callback(null, {
      "result": "\"좋아요\" 이모티콘이 해제되었습니다."
  });
};
