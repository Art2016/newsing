var dbPool = require('../models/common').dbPool;
var fs = require('fs');
var async = require('async');
var path = require('path');
var url = require('url');

// 사용자의 이름과 사진 경로 조회
module.exports.findByNameAndProfileUrl = function(id, callback) {
  var sql = 'select id, name, pf_path from user where id = ?';

  dbPool.getConnection(function(err, conn) {
    if (err) return callback(err);
    conn.query(sql, [id], function (err, results) {
      conn.release();
      if (err) return callback(err);
      if (results.length === 0) return callback(null, false);
      var user = {};
      user.id = results[0].id;
      user.name = results[0].name;
      // http로 시작하면 페이스북 사진
      if(results[0].pf_path.match(/http.+/i)) {
        user.pf_url = results[0].pf_path;
      } else {
        var filename = path.basename(results[0].pf_path);
        user.pf_url = url.resolve(process.env.SERVER_HOST, '/images/' + filename);
      }
      callback(null, user);
    });
  });
};

// 사용자 조회
module.exports.findUser = function(id, callback) {
  var sql = 'select name, pf_path, aboutme, scrapings, followings, followers ' +
            'from user ' +
            'where id = ?';

  dbPool.getConnection(function(err, conn) {
    if (err) return callback(err);
    conn.query(sql, [id], function (err, results) {
      conn.release();
      if (err) return callback(err);
      if (results.length === 0) return callback(null, false);
      var user = {};
      user.name = results[0].name;
      // http로 시작하면 페이스북 사진
      if(results[0].pf_path.match(/http.+/i)) {
        user.pf_url = results[0].pf_path;
      } else {
        var filename = path.basename(results[0].pf_path);
        user.pf_url = url.resolve(process.env.SERVER_HOST, '/images/' + filename);
      }
      user.aboutme = results[0].aboutme;
      user.scrapings = results[0].scrapings;
      user.followings = results[0].followings;
      user.followers = results[0].followers;
      callback(null, user);
    });
  });
};

// 로그인 시 DB에서 조회하여 있으면 사용자 데이터를 제공, 없으면 저장 후 제공
module.exports.findOrCreate = function(profile, callback) {
  // 사용자 id 조회
  var sql_facebookid = "select id, name, pf_path " +
                        "from user " +
                        "where id = ?";
  // 사용자 생성
  var sql_insert_facebookid = "insert into user(id, token, name, pf_path) " +
                               "value (?, ?, ?, ?)";

  dbPool.getConnection(function(err, conn) {
    if (err) return callback(err);
    conn.query(sql_facebookid, [profile.id], function(err, results) {
      if (err) {
        conn.release();
        return callback(err);
      }
      if (results.length !== 0) {
        conn.release();
        var user = {};
        user.id = results[0].id;
        user.name = results[0].name;
        // http로 시작하면 페이스북 사진
        if(results[0].pf_path.match(/http.+/i)) {
          user.pf_url = results[0].pf_path;
        } else {
          var filename = path.basename(results[0].pf_path);
          user.pf_url = url.resolve(process.env.SERVER_HOST, '/images/' + filename);
        }
        return callback(null, user);
      }
      conn.query(sql_insert_facebookid, [profile.id, profile.displayName, profile.photos[0].value], function(err, result) {
        conn.release();
        if (err) {
          return callback(err);
        }
        var user = {};
        user.id = profile.id;
        user.name = profile.displayName;
        user.pf_url = profile.photos[0].value;
        return callback(null, user);
      });
    });
  });
};
// 사용자 정보 업데이트
module.exports.updateUser = function(user, callback) {
  // 원래 값
  var sql_select_user = 'select name, pf_path, aboutme ' +
                        'from user ' +
                        'where id = ?';
  // 이름, 사진 경로, 자기소개 업데이트
  var sql_update_user = 'update user ' +
                        'set name = ?, pf_path = ?, aboutme = ? ' +
                        'where id = ?';

  dbPool.getConnection(function(err, conn) {
    if (err) return callback(err);
    // 쿼리실행은 rollback이 되지만 파일은 안되기 때문에
    // 트랜잭션으로 파일 삭제 실패시 rollback!!
    conn.beginTransaction(function (err) {
      if (err) {
        conn.release();
        return callback(err);
      }
      // 변경할 때 값을 넣지 않는 부분에 대한 처리를 위해
      // 원래 값을 null 값에 적용하여 업데이트
      async.waterfall([nullValueDefaulting, updateUser], function (err) {
        if (err) {
          return conn.rollback(function () {
            conn.release();
            callback(err);
          });
        }
        conn.commit(function () {
          conn.release();
          callback(null, {
            "result": "수정이 완료되었습니다."
          });
        });
      });
    });
    // 받아온 값 중에 null값이 있는 경우 원래 값을 세팅
    function nullValueDefaulting(done) {
      conn.query(sql_select_user, [user.id], function(err, results) {
        if (err) {
          return done(err);
        }
        var originalUser = {}; // 원래 값을 넣을 객체
        originalUser.name = results[0].name;
        originalUser.pf_path = results[0].pf_path;
        originalUser.aboutme = results[0].aboutme;
        done(null, originalUser);
      });
    }
    // 업데이트 실행
    function updateUser(originalUser, done) {
      // null일 경우 원래 값 세팅
      var name = user.name || originalUser.name;
      var pf_path = user.pf || originalUser.pf_path;
      var aboutme = user.aboutme || originalUser.aboutme;

      conn.query(sql_update_user, [name, pf_path, aboutme, user.id], function(err, result) {
        conn.release();
        if (err) return done(err);
        // 이미지가 넘어왔을 경우 원본 이미지 삭제
        if (user.pf) {
          fs.unlink(originalUser.pf_path, function (err) {
            if (err) return done(err);
          });
        }
        done(null);
      });
    }
  });
};

// 카테고리 목록
module.exports.listCategory = function(data, callback) {
  var sql = '';
  if (data.usage === 'scrap') { // 스크랩페이지에서 보여지는 목록
    sql = 'select c.id id, c.name name ' +
          'from category c join user u on (u.id = c.user_id) ' +
          'where u.id = ? ' +
          'order by id ' +
          'limit ?, ?';
  } else if (data.usage === 'profile') { // 마이페이지에서 보여지는 목록
    sql = 'select c.id id, c.name name, c.img_path img_path, c.private private ' +
          'from category c join user u on (u.id = c.user_id) ' +
          'where u.id = ? ' +
          'order by id ' +
          'limit ?, ?';
  } else {
    callback(null, false);
  }

  dbPool.getConnection(function(err, conn) {
    if (err) return callback(err);

    conn.query(sql, [data.uid, data.count * (data.page - 1), data.count], function(err, results) {
      conn.release();
      if (err) return callback(err);

      async.map(results, function(item, done) {
        if (data.usage === 'profile') {
          var img_url = '';
          if (item.img_path === 'default') {
            img_url = item.img_path;
          } else {
            var filename = path.basename(item.img_path);
            img_url = url.resolve(process.env.SERVER_HOST, '/images/' + filename);
          }
        }

        done(null, {
          "id": item.id,
          "name": item.name,
          "img_url": img_url,
          "private": item.private
        });
      }, function(err, categories) {
        if (err) callback(err);
        callback(null, categories);
      });
    });
  });
};

// 카테고리 생성
module.exports.createCategory = function(category, callback) {
  var sql = 'insert into category(user_id, name, img_path, private) values(?, ?, ?, ?)';

  dbPool.getConnection(function(err, conn) {
    if (err) return callback(err);
    conn.query(sql, [category.uid, category.name, category.pf, category.private], function(err, result) {
      conn.release();
      if (err) return callback(err);
      callback(null, {
        "result": "카테고리 생성이 완료되었습니다."
      });
    });
  });
};

// 카테고리 업데이트
module.exports.updateCategory = function(category, callback) {
  // 원래 값
  var sql_select_category = 'select name, img_path, private ' +
                            'from category ' +
                            'where id = ?';
  // 이름, 이미지 경로, 비공개 여부 업데이트
  var sql_update_category = 'update category ' +
                            'set name = ?, img_path = ?, private = ? ' +
                            'where id = ?';

  dbPool.getConnection(function(err, conn) {
    if (err) return callback(err);
    // 쿼리실행은 rollback이 되지만 파일은 안되기 때문에
    // 트랜잭션으로 파일 삭제 실패시 rollback!!
    conn.beginTransaction(function (err) {
      if (err) {
        conn.release();
        return callback(err);
      }
      // 변경할 때 값을 넣지 않는 부분에 대한 처리를 위해
      // 원래 값을 null 값에 적용하여 업데이트
      async.waterfall([nullValueDefaulting, updateCategory], function (err) {
        if (err) {
          return conn.rollback(function () {
            conn.release();
            callback(err);
          });
        }
        conn.commit(function () {
          conn.release();
          callback(null, {
            "result": "수정이 완료되었습니다."
          });
        });
      });
    });
    // 받아온 값 중에 null값이 있는 경우 원래 값을 세팅
    function nullValueDefaulting(done) {
      conn.query(sql_select_category, [category.cid], function(err, results) {
        if (err) return done(err);
        if (results.length === 0) return callback(null, false);

        var originalUser = {}; // 원래 값을 넣을 객체
        originalUser.name = results[0].name;
        originalUser.img_path = results[0].img_path;
        originalUser.private = results[0].private;
        done(null, originalUser);
      });
    }
    // 업데이트 실행
    function updateCategory(originalUser, done) {
      // null일 경우 원래 값 세팅
      var name = category.name || originalUser.name;
      var img_path = category.img_path || originalUser.img_path;
      var priv = category.private || originalUser.private;

      conn.query(sql_update_category, [name, img_path, priv, category.cid], function(err, result) {
        if (err) return done(err);
        // 이미지가 넘어왔을 경우 원본 이미지 삭제
        if (category.img_path) {
          fs.unlink(originalUser.img_path, function (err) {
            if (err) return done(err);
          });
        }
        done(null);
      });
    }
  });
};

// 카테고리 삭제
module.exports.removeCategory = function(id, callback) {
  var sql_select_category_img = 'select img_path from category where id = ?';
  var sql_delete_category = 'delete from category where id = ?';

  dbPool.getConnection(function(err, conn) {
    if (err) return callback(err);

    conn.beginTransaction(function (err) {
      if (err) {
        conn.release();
        return callback(err);
      }
      // db에서 카테고리 삭제 후 실제 이미지 파일 삭제
      // db는 rollback이 되지만 파일은 안되기 때문에...
      async.series([deleteCategory, deleteImage], function(err) {
        if (err) {
          return conn.rollback(function () {
            conn.release();
            callback(err);
          });
        }
        conn.commit(function () {
          conn.release();
          callback(null, {
            "result": "카테고리 삭제가 완료되었습니다."
          });
        });
      });
    });
    // 카테고리 삭제
    function deleteCategory(done) {
      conn.query(sql_delete_category, [id], function(err, result) {
        if (err) return done(err);
        done(null);
      });
    }
    // 실제 이미지 파일 삭제
    function deleteImage(done) {
      conn.query(sql_select_category_img, [id], function(err, results) {
        if (err) return done(err);
        if (results.length === 0) return callback(null, false);
        fs.unlink(results[0].img_path, function (err) {
          if (err) return done(err);
          done(null);
        });
      });
    }
  });
};
