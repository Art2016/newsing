var dbPool = require('../common/dbpool');
var async = require('async');

// 스크랩 생성
module.exports.createScrap = function(scrap, callback) {
  // 해당 카테고리의 사용자 아이디와 비공개 여부
  var sql_select_category = 'select user_id, locked from category where id = ?';
  // scrap을 생성
  var sql_inserte_scrap = 'insert into scrap(category_id, news_contents_id, title, content, locked) ' +
                          'values(?, ?, ?, ?, ?)';
  // 해당 해쉬태그가 존재하는지 검색
  var sql_select_hashtag = 'select id from hashtag where tag = ?';
  // 없다면 해쉬태그 생성
  var sql_insert_hashtag = 'insert into hashtag(tag) values(?)';
  // scrap_id와 hashtag_id로 scrap_tag 생성
  var sql_insert_scrap_tag = 'insert into scrap_tag(scrap_id, hashtag_id) values(?, ?)';
  // 스크랩 생성 시 사용자의 스크랩 수 1 증가
  var sql_update_scrapings = 'update user set scrapings = scrapings + 1 where id = ?';
  // 팔로워들의 토큰 값 가져오기
  var sql_select_user_fcm_token = 'select id, fcm_token from follow f join user u on (f.user_id = u.id) where user_id_o = ?';
  // 알림내역 생성
  var sql_insert_notification = 'insert into notification(user_id_s, user_id_r, type, message, data_pk) values(?, ?, ?, ?, ?)';

  dbPool.logStatus();
  dbPool.getConnection(function(err, conn) {
    if (err) return callback(err);

    conn.beginTransaction(function (err) {
      if (err) {
        conn.release();
        dbPool.logStatus();
        return callback(err);
      }
      // scrap과 hashtag를 저장하고 나온 insertId(또는 원래 태그 id)로 scrap_tag 생성, scrapings +1
      async.parallel([createScrap, createHashtag, increaseScrapins], function(err, results) {
        /* ---------- parallel last callback start ---------- */
        if (err) {
          return conn.rollback(function() {
            conn.release();
            dbPool.logStatus();
            callback(err);
          });
        }
        // 해쉬태그가 있을 때
        if (results[1]) {
          // scrap_tag 테이블에 넘어온 id값을 insert
          // results[0] => scrap_id / results[1] => [hashtag_id]
          async.each(results[1], function(hashtag_id, cb) {
            conn.query(sql_insert_scrap_tag, [results[0], hashtag_id], function(err, result) {
              if (err) return cb(err);
              cb(null)
            });
          }, function(err) {
            if (err) {
              return conn.rollback(function() {
                conn.release();
                dbPool.logStatus();
                callback(err);
              });
            }
            // 스크랩 공개 여부에 따른 알림 내역 생성
            if (scrap.locked === '0') {
              makeNotification();
            } else {
              conn.commit(function() {
                conn.release();
                dbPool.logStatus();
                callback(null, true);
              });
            }
          });
        }
        // 해쉬태그가 없으면 바로 커밋!!
        else {
          // 스크랩 공개 여부에 따른 알림 내역 생성
          if (scrap.locked === '0') {
            makeNotification();
          } else {
            conn.commit(function() {
              conn.release();
              dbPool.logStatus();
              callback(null, true);
            });
          }
        }

        function makeNotification() {
          async.waterfall([getTokens, createNotification], function(err, msgData) {
            if (err) {
              return conn.rollback(function() {
                conn.release();
                dbPool.logStatus();
                callback(err);
              });
            }
            conn.commit(function() {
              conn.release();
              dbPool.logStatus();
              callback(null, msgData);
            });
          });
        }
        // 나를 팔로잉하는 사람들의 토큰 값 가져오기
        function getTokens(next) {
          conn.query(sql_select_user_fcm_token, [scrap.uid], function(err, results) {
            if (err) return next(err);

            async.map(results, function(item, done) {
              done(null, {
                ids: item.id,
                fcm_tokens: item.fcm_token
              });
            }, function(err, data) {
              if (err) return next(err);

              var msgData = {}; // 메시지 생성
              msgData.messageObj = {
                collapseKey: '1',
                delayWhileIdle: true,
                timeToLive: 3,
                notification: {
                  title: "Newsing Alarm",
                  body: scrap.uname + "님이 새로운 스크랩을 작성하였습니다."
                }
              };
              var ids = []; // 받는 사용자 아이디들
              msgData.tokens = []; // 받는 사용자 토큰들

              async.each(data, function(item, indone) { // 객체배열을 나누어 배열에 담기
                ids.push(item.ids);
                msgData.tokens.push(item.fcm_tokens);

                indone(null);
              }, function(err) {
                if (err) return next(err);
                next(null, msgData, ids);
              });
            });
          });
        }
        // 알림내역 생성
        function createNotification(msgData, ids, next) {
          // user_id_s, user_id_r, type, message, data_pk
          var message = msgData.messageObj.notification.body;
          async.each(ids, function(id, done) {
            conn.query(sql_insert_notification, [scrap.uid, id, 1, message, results[0]], function(err) {
              if (err) return done(err);
              done(null);
            });
          }, function(err) {
            if (err) next(err);
            next(null, msgData);
          });
        }
        /* ---------- parallel last callback end ---------- */
      });
    });

    // scrap 생성
    function createScrap(done) {
      dbPool.logStatus();
      dbPool.getConnection(function(err, oConn) {
        if (err) return done(err);

        oConn.query(sql_select_category, [scrap.cid], function(err, results) {
          if (err) {
            oConn.release();
            dbPool.logStatus();

            return done(err);
          }
          // 해당 카테고리가 없을 경우
          if (results.length === 0) {
            oConn.release();
            dbPool.logStatus();

            return conn.rollback(function() {
              conn.release();
              dbPool.logStatus();

              callback(null, false);
            });
          }
          // 나의 카테고리가 아닌 곳에 생성할 때
          if (results[0].user_id !== scrap.uid) {
            oConn.release();
            dbPool.logStatus();
            return conn.rollback(function() {
              conn.release();
              dbPool.logStatus();

              callback(null, '403');
            });
          }

          oConn.query(sql_inserte_scrap,
            [scrap.cid, scrap.ncid, scrap.title, scrap.content, scrap.locked],
            function(err, result) {
              oConn.release();
              dbPool.logStatus();
              if (err) return done(err);
              // scrap_tag insert를 위한 id
              done(null, result.insertId);
          });
        });
      });
    }
    // hashtag 생성
    function createHashtag(done) {
      dbPool.logStatus();
      dbPool.getConnection(function(err, oConn) {
        if (err) return done(err);
        // 해쉬태그 여부 검사
        if (scrap.tags.length !== 0) {
          var hashtag_id = [];

          async.each(scrap.tags, function(tag, cb) {
            // 해당 태그가 있는지 검색
            oConn.query(sql_select_hashtag, [tag], function(err, results) {
              if (err) return cb(err);
              // 태그가 있으면 찾아온 태그 아이디를 배열에 넣기
              if (results.length !== 0) {
                hashtag_id.push(results[0].id);
                cb(null);
              } else { // 없으면 insert 후 insertId를 배열에 넣기
                oConn.query(sql_insert_hashtag, [tag], function(err, result) {
                  if (err) return cb(err);
                  hashtag_id.push(result.insertId);
                  cb(null);
                });
              }
            });
          }, function(err) {
            oConn.release();
            dbPool.logStatus();
            if (err) done(err);

            done(null, hashtag_id);
          });
        } else { // 해쉬태그가 없을 때 false 반환
          oConn.release();
          dbPool.logStatus();
          done(null, false);
        }
      });
    }
    // scrapings 증가
    function increaseScrapins(done) {
      dbPool.logStatus();
      dbPool.getConnection(function(err, oConn) {
        if (err) return done(err);

        oConn.query(sql_update_scrapings, [scrap.uid], function(err) {
          oConn.release();
          dbPool.logStatus();
          if (err) return done(err);

          done(null);
        });
      });
    }
  });
};

// 스크랩 목록
module.exports.listScrap = function(data, callback) {
  // 해당 category의 user_id
  var sql_select_category_user_id = 'select user_id from category where id = ?';
  // 스크랩들을 최신순으로 찾는 쿼리(나일 때)
  var sql_select_scrap = 'select s.id, ' +
                                 's.title, ' +
                                 'nc.title nc_title, ' +
                                 'nc.img_url nc_img_url, ' +
                                 'nc.author nc_author, ' +
                                 'date_format(convert_tz(nc.ntime, "+00:00", "+09:00"), "%Y-%m-%d %H:%i:%s") nc_ntime, ' +
                                 'locked, ' +
                                 'favorite_cnt, ' +
                                 'case when f.scrap_id is not null then 1 else 0 end favorite ' +
                         'from scrap s join news_contents nc on (nc.id = s.news_contents_id) ' +
                                       'left join (select scrap_id from favorite where user_id = ?) f on (s.id = f.scrap_id) ' +
                         'where s.category_id = ? ' +
                         'order by id desc ' +
                         'limit ?, ?';
  // 스크랩들을 최신순으로 찾는 쿼리(타인일 때)
  var sql_select_scrap_o = 'select s.id, ' +
                                 's.title, ' +
                                 'nc.title nc_title, ' +
                                 'nc.img_url nc_img_url, ' +
                                 'nc.author nc_author, ' +
                                 'date_format(convert_tz(nc.ntime, "+00:00", "+09:00"), "%Y-%m-%d %H:%i:%s") nc_ntime, ' +
                                 's.locked, ' +
                                 's.favorite_cnt, ' +
                                 'case when f.scrap_id is not null then 1 else 0 end favorite ' +
                         'from scrap s join news_contents nc on (nc.id = s.news_contents_id) ' +
                                       'join category c on (c.id = s.category_id) ' +
                                       'left join (select scrap_id from favorite where user_id = ?) f on (s.id = f.scrap_id) ' +
                         'where s.category_id = ? and s.locked = 0 and c.locked = 0 ' +
                         'order by id desc ' +
                         'limit ?, ?';

  dbPool.logStatus();
  dbPool.getConnection(function(err, conn) {
    if (err) return callback(err);
    var sql = '';
    // user_id를 찾아 비교하여 내 스크랩 목록인지 판단
    // 스크랩 목록 조회
    async.waterfall([checkMyScrapList, getListScrap], function(err, results) {
      conn.release();
      dbPool.logStatus();
      if (err) return callback(err);
      callback(null, results);
    });
    // 내 스크랩인지 판단
    function checkMyScrapList(next) {
      conn.query(sql_select_category_user_id, [data.cid], function(err, results) {
        if (err) return next(err);

        var scraps = {}; // 스크랩 내용을 담을 객체
        scraps.results = [];
        // 결과 값이 없을 경우 빈 배열
        if (results.length === 0) {
          conn.release();
          return callback(null, scraps);
        }

        if (results[0].user_id === data.uid) sql = sql_select_scrap;
        else sql = sql_select_scrap_o;
        next(null, sql, scraps);
      });
    }
    // 리스트 목록 얻어오기
    function getListScrap(sql, scraps, next) {
      conn.query(sql, [data.uid, data.cid, data.count * (data.page - 1), data.count], function(err, results) {
        if (err) return next(err);
        // 결과 값이 없을 경우 빈 배열
        if (results.length === 0) {
          conn.release();
          return callback(null, scraps);
        }

        // 배열에 검색된 내용을 담기
        async.each(results, function(item, done) {
          scraps.results.push({
            id: item.id,
            title: item.title,
            nc_title: item.nc_title,
            nc_img_url: item.nc_img_url,
            nc_author: item.nc_author,
            nc_ntime: item.nc_ntime,
            locked: (item.locked === 1) ? true : false,
            favorite_cnt: item.favorite_cnt,
            favorite: (item.favorite === 1) ? true : false
          });

          done(null);
        }, function(err) {
          if (err) return next(err);
          next(null, scraps);
        });
      });
    }
  });
};

// 스크랩 삭제
module.exports.removeScrap = function(sid, uid, callback) {
  // scrap_id가 매개변수 sid인 favorite 삭제
  var sql_delete_favorite = 'delete from favorite where scrap_id = ?';
  // scrap_id가 매개변수 sid인 scrap_tag 삭제
  var sql_delete_scrap_tag = 'delete from scrap_tag where scrap_id = ?';
  // sid가 매개변수 sid인 scrap 삭제
  var sql_delete_scrap = 'delete from scrap where id = ?';
  // 스크랩 삭제 시 사용자의 스크랩 수 1 감소
  var sql_update_scrapings = 'update user set scrapings = scrapings - 1 where id = ?';

  dbPool.logStatus();
  dbPool.getConnection(function(err, conn) {
    if (err) return callback(err);

    conn.beginTransaction(function(err) {
      if (err) {
        conn.release();
        dbPool.logStatus();
        return callback(err);
      }
      // fk로 쓰이고 있는 favorite와 scrap_tag 삭제 후 scrap 삭제, scrapings -1
      async.series([removeFavorite, removeScrapTag, removeScrap, decreaseScrapins], function(err) {
        if (err) {
          return conn.rollback(function() {
            conn.release();
            dbPool.logStatus();
            callback(err);
          });
        }
        conn.commit(function() {
          conn.release();
          dbPool.logStatus();
          callback(null, {
            "result": "스크랩 삭제가 완료되었습니다."
          });
        });
      });
    });
    // favorite 삭제
    function removeFavorite(next) {
      conn.query(sql_delete_favorite, [sid], function(err) {
        if (err) return next(err);
        next(null);
      });
    }
    // scrap_tag 삭제
    function removeScrapTag(next) {
      conn.query(sql_delete_scrap_tag, [sid], function(err) {
        if (err) return next(err);
        next(null);
      });
    }
    // scrap 삭제
    function removeScrap(next) {
      conn.query(sql_delete_scrap, [sid], function(err, result) {
        if (err) return next(err);
        if (result.affectedRows === 0) {
          return conn.rollback(function() {
            conn.release();
            dbPool.logStatus();
            callback(null, false);
          });
        }
        next(null);
      });
    }
    // scrapings 감소
    function decreaseScrapins(next) {
      conn.query(sql_update_scrapings, [uid], function(err) {
        if (err) return next(err);
        next(null);
      });
    }
  });
};

// 스크랩 변경
module.exports.updateScrap = function(scrap, callback) {
  // scrap을 update
  var sql_update_scrap = 'update scrap set ? where id = ?';
  // 해당 해쉬태그가 존재하는지 검색
  var sql_select_hashtag = 'select id from hashtag where tag = ?';
  // 없다면 해쉬태그 생성
  var sql_insert_hashtag = 'insert into hashtag(tag) values(?)';
  // scrap_tag 해당 id 다 삭제
  var sql_delete_scrap_tag = 'delete from scrap_tag where scrap_id = ?';
  // scrap_id와 hashtag_id로 scrap_tag 생성
  var sql_insert_scrap_tag = 'insert into scrap_tag(scrap_id, hashtag_id) values(?, ?)';

  dbPool.logStatus();
  dbPool.getConnection(function(err, conn) {
    if (err) return callback(err);

    conn.beginTransaction(function(err) {
      if (err) {
        conn.release();
        dbPool.logStatus();
        return callback(err);
      }
      // scrap과 hashtag를 업데이트하고 나온 id로 scrap_tag 생성
      async.parallel([updateScrap, createHashtag, removeScrapTag], function(err, results) {
        if (err) {
          return conn.rollback(function() {
            conn.release();
            dbPool.logStatus();
            callback(err);
          });
        }
        // 해쉬태그가 있을 때
        if (results[1]) {
          // scrap_tag 테이블에 넘어온 id값을 insert
          // results[1] => [hashtag_id]
          async.each(results[1], function(hashtag_id, cb) {
            conn.query(sql_insert_scrap_tag, [scrap.id, hashtag_id], function(err, result) {
              if (err) return cb(err);
              cb(null)
            });
          }, function(err) {
            if (err) {
              return conn.rollback(function() {
                conn.release();
                dbPool.logStatus();
                callback(err);
              });
            }
            conn.commit(function() {
              conn.release();
              dbPool.logStatus();
              callback(null, {
                "result": "스크랩 수정을 완료하였습니다."
              });
            });
          });
        } else { // 해쉬태그가 없으면 바로 커밋!!
          conn.commit(function() {
            conn.release();
            dbPool.logStatus();
            callback(null, {
              "result": "스크랩 수정을 완료하였습니다."
            });
          });
        }
      });
    });
    // scrap 업데이트
    function updateScrap(done) {
      conn.query(sql_update_scrap, [scrap.data, scrap.id], function(err, result) {
          if (err) return done(err);
          // 해당하는 값이 없을 때
          if (result.affectedRows === 0) {
            return conn.rollback(function() {
              conn.release();
              dbPool.logStatus();
              callback(null, false);
            });
          }
          done(null);
      });
    }
    // hashtag 생성
    function createHashtag(done) {
      // 해쉬태그 여부 검사
      if (scrap.tags.length !== 0) {
        var hashtag_id = [];

        async.each(scrap.tags, function(tag, cb) {
          // 해당 태그가 있는지 검색
          conn.query(sql_select_hashtag, [tag], function(err, results) {
            if (err) return cb(err);
            // 태그가 있으면 찾아온 태그 아이디를 배열에 넣기
            if (results.length !== 0) {
              hashtag_id.push(results[0].id);
              cb(null);
            } else { // 없으면 insert 후 insertId를 배열에 넣기
              conn.query(sql_insert_hashtag, [tag], function(err, result) {
                if (err) return cb(err);
                hashtag_id.push(result.insertId);
                cb(null);
              });
            }
          });
        }, function(err) {
          if (err) done(err);
          done(null, hashtag_id);
        });
      } else { // 해쉬태그가 없을 때 false 반환
        done(null, false);
      }
    }
    // scrap_tag 삭제
    function removeScrapTag(done) {
      conn.query(sql_delete_scrap_tag, [scrap.id], function(err, result) {
        if (err) return done(err);
        done(null);
      });
    }
  });
};

// 스크랩 상세 조회
module.exports.findScrap = function(sid, uid, callback) {
  // 특정 스크랩 검색
  var sql_select_scrap = 'select s.title, ' +
                                 'nc.title nc_title, ' +
                                 'nc.content nc_content, ' +
                                 'nc.img_url nc_img_url, ' +
                                 'nc.link nc_link, ' +
                                 'nc.author nc_author, ' +
                                 'date_format(convert_tz(nc.ntime, "+00:00", "+09:00"), "%Y-%m-%d %H:%i:%s") nc_ntime, ' +
                                 's.content, ' +
                                 'date_format(convert_tz(s.dtime, "+00:00", "+09:00"), "%Y-%m-%d %H:%i:%s") dtime, ' +
                                 's.favorite_cnt, ' +
                                 'case when f.scrap_id is not null then 1 else 0 end favorite, ' +
                                 'c.user_id, ' +
                                 's.locked slocked, ' +
                                 'c.locked clocked,'
                         'from scrap s join news_contents nc on (s.news_contents_id = nc.id) ' +
                                       'join category c on (c.id = s.category_id) ' +
                                       'left join (select scrap_id from favorite where user_id = ?) f on (s.id = f.scrap_id) ' +
                         'where s.id = ?';
  // 스크랩의 태그들 검색
  var sql_select_scrap_tag = 'select h.tag from scrap_tag st join hashtag h on (st.hashtag_id = h.id) where st.scrap_id = ?';

  dbPool.logStatus();
  dbPool.getConnection(function(err, conn) {
    if (err) return callback(err);

    var scraps = {}; // 스크랩 내용을 담을 객체
    // 스크랩 내용을 검색한 다음 해당 id로 favorite 활성화 여부 검사하여 scraps 객체에 추가
    // 그 다음 해당 스크랩의 태그를 검색하여 scraps 객체에 추가
    async.series([findScrap, findScrapTag], function(err) {
      conn.release();
      dbPool.logStatus();
      if (err) return callback(err);
      callback(null, scraps);
    });
    // 스크랩 내용 검색
    function findScrap(next) {
      conn.query(sql_select_scrap, [uid, sid], function(err, results) {
        if (err) return next(err);
        // 결과 값이 없을 경우 빈 객체
        if (results.length === 0) {
          conn.release();
          dbPool.logStatus();
          return callback(null, scraps);
        }
        // 타인이 접근할려 할 때
        if ((results[0].clocked === 1 || results[0].slocked === 1) && results[0].user_id !== uid) {
          conn.release();
          dbPool.logStatus();
          return callback(null, '403');
        }

        scraps.title = results[0].title;
        scraps.nc_title = results[0].nc_title;
        scraps.nc_content = results[0].nc_content;
        scraps.nc_img_url = results[0].nc_img_url;
        scraps.nc_link = results[0].nc_link;
        scraps.nc_author = results[0].nc_author;
        scraps.nc_ntime = results[0].nc_ntime;
        scraps.content = results[0].content;
        scraps.dtime = results[0].dtime;
        scraps.favorite_cnt = results[0].favorite_cnt;
        scraps.favorite = (results[0].favorite === 1) ? true : false;

        next(null);
      });
    }
    // 스크랩 태그 검색
    function findScrapTag(next) {
      conn.query(sql_select_scrap_tag, [sid], function(err, results) {
        if (err) return next(err);
        // tag들을 담을 배열 생성
        scraps.tags = [];
        // 태그가 없으면 빈 배열인채로 return
        if (results.length === 0) return next(null);
        // results에서 하나씩 꺼내서 배열에 담기
        async.each(results, function(item, done) {
          scraps.tags.push(item.tag);
          done(null);
        }, function(err) {
          if (err) return next(err);
          next(null);
        });
      });
    }
  });
};

// 해당 스크랩을 다른 카테고리로 이동
module.exports.moveCategory = function(sid, cid, uid, callback) {
  // 카테고리 아이디 찾기
  var sql_select_category_id = 'select id, user_id from category where id = ?';
  // 스크랩의 카테고리 번호 변경
  var sql_update_scrap_category_id = 'update scrap set category_id = ? where id = ?';

  dbPool.logStatus();
  dbPool.getConnection(function(err, conn) {
    if (err) return callback(err);

    async.series([checkCategory, updateScrapCategoryId], function(err) {
      conn.release();
      dbPool.logStatus();
      if (err) return callback(err);
      callback(null, { "result": "카테고리 이동이 완료되었습니다." });
    });

    // 카테고리가 존재하는지 체크
    function checkCategory(next) {
      conn.query(sql_select_category_id, [cid], function(err, results) {
        if (err) return next(err);
        // 결과 값이 없을 경우 404
        if (results.length === 0) {
          conn.release();
          dbPool.logStatus();
          return callback(null, false);
        }
        // 나의 카테고리가 아닌 경우
        if (results[0].user_id !== uid) {
          conn.release();
          dbPool.logStatus();
          return callback(null, '403');
        }
        next(null);
      });
    }
    // 스크랩의 카테고리 아이디를 업데이트
    function updateScrapCategoryId(next) {
      conn.query(sql_update_scrap_category_id, [cid, sid], function(err) {
        if (err) return next(err);
        next(null);
      });
    }
  });
};

// favorite 생성
module.exports.createFavorite = function(sid, uid, uname, callback) {
  // favorite 생성
  var sql_insert_favorite = 'insert into favorite(user_id, scrap_id) values(?, ?)';
  // "좋아요" 카운트 증가
  var sql_update_favorite_cnt = 'update scrap set favorite_cnt = favorite_cnt + 1 where id = ?';
  // 스크랩 작성자의 토큰 값 가져오기
  var sql_select_user_fcm_token = 'select u.id, u.fcm_token ' +
                                  'from scrap s join category c on (c.id = s.category_id) ' +
                                                'join user u on (c.user_id = u.id) ' +
                                  'where s.id = ?';
  // 알림내역 생성
  var sql_insert_notification = 'insert into notification(user_id_s, user_id_r, type, message, data_pk) values(?, ?, ?, ?, ?)';

  dbPool.logStatus();
  dbPool.getConnection(function(err, conn) {
    if (err) return callback(err);

    conn.beginTransaction(function (err) {
      if (err) {
        conn.release();
        dbPool.logStatus();
        return callback(err);
      }
      // favorite 생성 및 카운트
      async.parallel([createFavorite, increaseFavoriteCnt], function (err) {
        if (err) {
          return conn.rollback(function() {
            conn.release();
            dbPool.logStatus();
            callback(err);
          });
        }

        async.waterfall([getTokens, createNotification], function(err, msgData) {
          if (err) {
            return conn.rollback(function() {
              conn.release();
              dbPool.logStatus();
              callback(err);
            });
          }
          conn.commit(function() {
            conn.release();
            dbPool.logStatus();
            callback(null, msgData);
          });
        });
        // 토큰 값 얻고 메시지 생성
        function getTokens(next) {
          conn.query(sql_select_user_fcm_token, [sid], function(err, results) {
            if (err) return next(err);

            var msgData = {}; // 메시지 생성
            msgData.messageObj = {
              collapseKey: '2',
              delayWhileIdle: true,
              timeToLive: 3,
              notification: {
                title: "Newsing Alarm",
                body: uname + "님이 내 스크랩에 '좋아요'를 눌렀습니다."
              }
            };
            msgData.tokens = [results[0].fcm_token];

            next(null, msgData, results[0].id);
          });
        }
        // 알림내역 생성
        function createNotification(msgData, receiver, next) {
          // user_id_s, user_id_r, type, message, data_pk
          var message = msgData.messageObj.notification.body;
          conn.query(sql_insert_notification, [uid, receiver, 2, message, sid], function(err) {
            if (err) return next(err);
            next(null, msgData);
          });
        }
      });
    });
    // favorite 생성
    function createFavorite(done) {
      conn.query(sql_insert_favorite, [uid, sid], function(err) {
        if (err) return done(err);
        done(null);
      });
    }
    // scrap에 favorite_cnt +1 증가
    function increaseFavoriteCnt(done) {
      conn.query(sql_update_favorite_cnt, [sid], function(err) {
        if (err) return done(null);
        done(null);
      });
    }
  });
};

// favorite 삭제
module.exports.removeFavorite = function(sid, uid, callback) {
  // favorite 삭제
  var sql_delete_favorite = 'delete from favorite where user_id = ? and scrap_id = ?';
  // "좋아요" 카운트 감소
  var sql_update_favorite_cnt = 'update scrap set favorite_cnt = favorite_cnt - 1 where id = ?';

  dbPool.logStatus();
  dbPool.getConnection(function(err, conn) {
    if (err) return callback(err);

    conn.beginTransaction(function (err) {
      if (err) {
        conn.release();
        dbPool.logStatus();
        return callback(err);
      }
      // favorite 생성 및 카운트
      async.parallel([removeFavorite, decreaseFavoriteCnt], function (err) {
        if (err) {
          return conn.rollback(function() {
            conn.release();
            dbPool.logStatus();
            callback(err);
          });
        }
        conn.commit(function() {
          conn.release();
          dbPool.logStatus();
          callback(null, {
            "result": "'좋아요' 이모티콘이 해제되었습니다."
          });
        });
      });
    });
    // favorite 삭제
    function removeFavorite(done) {
      conn.query(sql_delete_favorite, [uid, sid], function(err, result) {
        if (err) return done(null);
        // 삭제할 게 없는 경우
        if (result.affectedRows === 0) {
          return conn.rollback(function() {
            conn.release();
            dbPool.logStatus();
            callback(null, false);
          });
        }
        done(null);
      });
    }
    // scrap에 favorite_cnt -1 감소
    function decreaseFavoriteCnt(done) {
      conn.query(sql_update_favorite_cnt, [sid], function(err) {
        if (err) return done(null);
        done(null);
      });
    }
  });
};
