var dbPool = require('../common/dbpool');
var async = require('async');
var path = require('path');
var url = require('url');

// 팔로잉 / 팔로워 목록
module.exports.listFollowing = function(data, callback) {
  var sql = 'select u.id, u.pf_path, u.name, u.aboutme ' +
            'from follow f join user u on (f.user_id_o = u.id) ' +
            'where user_id = ? ' +
            'limit ?, ?';

  dbPool.getConnection(function(err, conn) {
    if (err) return callback(err);

    conn.query(sql, [data.id, data.count * (data.page - 1), data.count], function (err, results) {
      conn.release();
      if (err) return callback(err);
      // 팔로잉 목록을 담을 객체
      var followings = {};
      followings['results'] = [];
      // 결과 값이 없을 때 빈 배열
      if (results.length === 0) callback(null, followings);

      async.each(results, function(item, done) {
        var pf_url = '';
        // http로 시작하면 페이스북 사진
        if(item.pf_path.match(/http.+/i)) {
          pf_url = item.pf_path;
        } else { // 파일에 접근할 url 생성
          var filename = path.basename(item.pf_path);
          pf_url = url.resolve(process.env.SERVER_HOST, '/images/profile/' + filename);
        }
        followings.results.push({
          id: item.id,
          pf_url: pf_url,
          name: item.name,
          aboutme: item.aboutme
        });

        done(null);
      }, function(err) {
        if (err) return callback(err);
        callback(null, followings);
      });
    });
  });
};

module.exports.listFollower = function(data, callback) {
  var sql = 'select u.id, u.pf_path, u.name, u.aboutme ' +
            'from follow f join user u on (f.user_id = u.id) ' +
            'where user_id_o = ? ' +
            'limit ?, ?';

  dbPool.getConnection(function(err, conn) {
    if (err) return callback(err);

    conn.query(sql, [data.id, data.count * (data.page - 1), data.count], function (err, results) {
      conn.release();
      if (err) return callback(err);
      // 팔로잉 목록을 담을 객체
      var followers = {};
      followers['results'] = [];
      // 결과 값이 없을 때 빈 배열
      if (results.length === 0) callback(null, followers);

      async.each(results, function(item, done) {
        var pf_url = '';
        // http로 시작하면 페이스북 사진
        if(item.pf_path.match(/http.+/i)) {
          pf_url = item.pf_path;
        } else { // 파일에 접근할 url 생성
          var filename = path.basename(item.pf_path);
          pf_url = url.resolve(process.env.SERVER_HOST, '/images/' + filename);
        }
        followers.results.push({
          id: item.id,
          pf_url: pf_url,
          name: item.name,
          aboutme: item.aboutme
        });

        done(null);
      }, function(err) {
        if (err) return callback(err);
        callback(null, followers);
      });
    });
  });
};

module.exports.createFollow = function(id, id_o, callback) {
  // 팔로우 생성
  var sql_insert_follow = 'insert into follow(user_id, user_id_o) values(?, ?)';
  // 팔로잉 +1 증가
  var sql_update_followins = 'update user set followings = followings + 1 where id = ?';
  // 팔로워 +1 증가
  var sql_update_followers = 'update user set followers = followers + 1 where id = ?';

  dbPool.getConnection(function(err, conn) {
    if (err) return callback(err);
    conn.beginTransaction(function (err) {
      if (err) {
        conn.release();
        return callback(err);
      }
      async.parallel([createFollow, increaseFollowings, increaseFollowers], function (err) {
        if (err) {
          return conn.rollback(function() {
            conn.release();
            callback(err);
          });
        }
        conn.commit(function() {
          conn.release();
          callback(null, {
            "results": "팔로우를 하였습니다."
          });
        });
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
  // 팔로잉 -1 증가
  var sql_update_followins = 'update user set followings = followings - 1 where id = ?';
  // 팔로워 -1 증가
  var sql_update_followers = 'update user set followers = followers - 1 where id = ?';

  dbPool.getConnection(function(err, conn) {
    if (err) return callback(err);
    conn.beginTransaction(function (err) {
      if (err) {
        conn.release();
        return callback(err);
      }
      async.parallel([removeFollow, decreaseFollowings, decreaseFollowers], function (err) {
        if (err) {
          return conn.rollback(function() {
            conn.release();
            callback(err);
          });
        }
        conn.commit(function() {
          conn.release();
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
