var dbPool = require('../common/dbpool');
var async = require('async');
var path = require('path');
var url = require('url');

// 팔로잉 / 팔로워 목록
module.exports.listFollow = function(data, callback) {
  var sql = '';
  var query_val = []; // to와 from일 때 동적인 쿼리 값 처리를 위한 배열

  if (data.direction === 'to') {
    sql = 'select u.id, u.pf_path, u.name, u.aboutme ' +
          'from follow f join user u on (f.user_id_o = u.id) ' +
          'where user_id = ? ' +
          'limit ?, ?';

    query_val.push(data.id);
    query_val.push(data.count * (data.page - 1));
    query_val.push(data.count);
  } else if (data.direction === 'from') {
    sql = 'select u.id, u.pf_path, u.name, u.aboutme, case when of.user_id_o is not null then 1 else 0 end flag ' +
          'from follow f join user u on (f.user_id = u.id) ' +
                         'left join (select user_id_o from follow where user_id = ?) of on (of.user_id_o = f.user_id) ' +
          'where f.user_id_o = ? ' +
          'limit ?, ?';

    query_val.push(data.id);
    query_val.push(data.id);
    query_val.push(data.count * (data.page - 1));
    query_val.push(data.count);
  }

  dbPool.logStatus();
  dbPool.getConnection(function(err, conn) {
    if (err) return callback(err);

    conn.query(sql, query_val, function (err, results) {
      conn.release();
      dbPool.logStatus();
      if (err) return callback(err);
      // 팔로잉 목록을 담을 객체
      var follows = {};
      follows['results'] = [];
      // 결과 값이 없을 때 빈 배열
      if (results.length === 0) callback(null, follows);

      async.each(results, function(item, done) {
        var pf_url = '';
        // http로 시작하면 페이스북 사진
        if(item.pf_path.match(/http.+/i)) {
          pf_url = item.pf_path;
        } else { // 파일에 접근할 url 생성
          var filename = path.basename(item.pf_path);
          pf_url = url.resolve(process.env.SERVER_HOST, '/images/profile/' + filename);
        }

        var flag = item.flag || 1; // 팔로잉일 경우 flag가 없음
        follows.results.push({
          id: item.id,
          pf_url: pf_url,
          name: item.name,
          aboutme: item.aboutme,
          flag: (flag === 1) ? true : false
        });

        done(null);
      }, function(err) {
        if (err) return callback(err);
        callback(null, follows);
      });
    });
  });
};

module.exports.createFollow = function(id, id_o, name, callback) {
  // 팔로우 생성
  var sql_insert_follow = 'insert into follow(user_id, user_id_o) values(?, ?)';
  // 팔로잉 +1 증가
  var sql_update_followins = 'update user set followings = followings + 1 where id = ?';
  // 팔로워 +1 증가
  var sql_update_followers = 'update user set followers = followers + 1 where id = ?';
  // 팔로우한 상대의 토큰 값 가져오기
  var sql_select_user_fcm_token = 'select fcm_token from user where id = ?';
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
      async.parallel([createFollow, increaseFollowings, increaseFollowers], function (err) {
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
          conn.query(sql_select_user_fcm_token, [id_o], function(err, results) {
            if (err) return next(err);

            var msgData = {}; // 메시지 생성
            msgData.messageObj = {
              collapseKey: '3',
              delayWhileIdle: true,
              timeToLive: 3,
              notification: {
                title: "Newsing Alarm",
                body: name + "님이 나를 팔로우하였습니다."
              }
            };
            msgData.tokens = [results[0].fcm_token];

            next(null, msgData);
          });
        }
        // 알림내역 생성
        function createNotification(msgData, next) {
          // user_id_s, user_id_r, type, message, data_pk
          var message = msgData.messageObj.notification.body;
          conn.query(sql_insert_notification, [id, id_o, 3, message, id], function(err) {
            if (err) return next(err);
            next(null, msgData);
          });
        }
      });
    });
    // 팔로우 생성
    function createFollow(done) {
      conn.query(sql_insert_follow, [id, id_o], function (err) {
        if (err) return done(err);
        done(null);
      });
    }
    // 팔로잉 +1 증가
    function increaseFollowings(done) {
      conn.query(sql_update_followins, [id], function (err) {
        if (err) return done(err);
        done(null);
      });
    }
    // 팔로워 +1 증가
    function increaseFollowers(done) {
      conn.query(sql_update_followers, [id_o], function (err) {
        if (err) return done(err);
        done(null);
      });
    }
  });
};

module.exports.removeFollow = function(id, id_o, callback) {
  // 팔로우 제거
  var sql_insert_follow = 'delete from follow where user_id = ? and user_id_o = ?';
  // 팔로잉 -1 감소
  var sql_update_followins = 'update user set followings = followings - 1 where id = ?';
  // 팔로워 -1 감소
  var sql_update_followers = 'update user set followers = followers - 1 where id = ?';

  dbPool.logStatus();
  dbPool.getConnection(function(err, conn) {
    if (err) return callback(err);
    conn.beginTransaction(function (err) {
      if (err) {
        conn.release();
        dbPool.logStatus();
        return callback(err);
      }
      async.parallel([removeFollow, decreaseFollowings, decreaseFollowers], function (err) {
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
            "results": "팔로우가 정상적으로 해제되었습니다."
          });
        });
      });
    });
    // 팔로우 제거
    function removeFollow(done) {
      conn.query(sql_insert_follow, [id, id_o], function (err, result) {
        if (err) return done(err);
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
    // 팔로잉 -1 증가
    function decreaseFollowings(done) {
      conn.query(sql_update_followins, [id], function (err) {
        if (err) return done(err);
        done(null);
      });
    }
    // 팔로워 -1 증가
    function decreaseFollowers(done) {
      conn.query(sql_update_followers, [id_o], function (err) {
        if (err) return done(err);
        done(null);
      });
    }
  });
};
