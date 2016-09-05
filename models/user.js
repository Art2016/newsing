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
      // 결과 값이 없을 경우 404
      if (results.length === 0) return callback(null, false);
      // 결과 값을 user객체에 담기
      var user = {};
      user.id = results[0].id;
      user.name = results[0].name;
      // http로 시작하면 페이스북 사진
      if(results[0].pf_path.match(/http.+/i)) {
        user.pf_url = results[0].pf_path;
      } else { // 파일에 접근할 url 생성
        var filename = path.basename(results[0].pf_path);
        user.pf_url = url.resolve(process.env.SERVER_HOST, '/images/' + filename);
      }
      callback(null, user);
    });
  });
};

// 사용자 조회
module.exports.findUser = function(id, callback) {
  // 이름, 프로필 사진 경로, 자기 소개, 스크랩 수, 팔로잉 수, 팔로워 수
  var sql = 'select name, pf_path, aboutme, scrapings, followings, followers ' +
            'from user ' +
            'where id = ?';

  dbPool.getConnection(function(err, conn) {
    if (err) return callback(err);
    conn.query(sql, [id], function (err, results) {
      conn.release();
      if (err) return callback(err);
      // 결과 값이 없을 경우 404
      if (results.length === 0) return callback(null, false);
      // 결과 값을 user객체에 담기
      var user = {};
      user.name = results[0].name;
      // http로 시작하면 페이스북 사진
      if(results[0].pf_path.match(/http.+/i)) {
        user.pf_url = results[0].pf_path;
      } else { // 파일에 접근할 url 생성
        var filename = path.basename(results[0].pf_path);
        user.pf_url = url.resolve(process.env.SERVER_HOST, '/images/' + filename);
      }
      user.aboutme = results[0].aboutme || ''; // null이 허용된 속성
      user.scrapings = results[0].scrapings;
      user.followings = results[0].followings;
      user.followers = results[0].followers;

      callback(null, user);
    });
  });
};

// 로그인 시 DB에서 조회하여 있으면 사용자 데이터를 제공, 없으면 저장 후 제공
module.exports.findOrCreate = function(profile, callback) {
  // 사용자 조회
  var sql_facebookid = "select id, name, pf_path, nt_fs, nt_s, nt_f " +
                        "from user " +
                        "where id = ?";
  // 사용자 생성
  var sql_insert_facebookid = "insert into user(id, name, pf_path) " +
                               "value (?, ?, ?)";

  dbPool.getConnection(function(err, conn) {
    if (err) return callback(err);
    // 이미 있는 사용자인지 조회
    conn.query(sql_facebookid, [profile.id], function(err, results) {
      if (err) {
        conn.release();
        return callback(err);
      }
      // 사용자가 이미 있다면...
      if (results.length !== 0) {
        conn.release();
        // 결과 값을 user객체에 담기
        var user = {};
        user.id = results[0].id;
        user.name = results[0].name;
        // http로 시작하면 페이스북 사진
        if(results[0].pf_path.match(/http.+/i)) {
          user.pf_url = results[0].pf_path;
        } else { // 파일에 접근할 url 생성
          var filename = path.basename(results[0].pf_path);
          user.pf_url = url.resolve(process.env.SERVER_HOST, '/images/' + filename);
        }
        user.nt_fs = (results[0].nt_fs === 1) ? true : false;
        user.nt_s = (results[0].nt_s === 1) ? true : false;
        user.nt_f = (results[0].nt_f === 1) ? true : false;
        return callback(null, user);
      }
      // 없으면 생성...
      conn.query(sql_insert_facebookid, [profile.id, profile.displayName, profile.photos[0].value], function(err) {
        conn.release();
        if (err) {
          return callback(err);
        }
        // 결과 값을 user객체에 담기
        var user = {};
        user.id = profile.id;
        user.name = profile.displayName;
        user.pf_url = profile.photos[0].value;
        user.nt_fs = true;
        user.nt_s = true;
        user.nt_f = true;
        return callback(null, user);
      });
    });
  });
};

// 사용자 정보 업데이트
module.exports.updateUser = function(user, callback) {
  // 원래 값
  var sql_select_user = 'select name, pf_path, aboutme, nt_fs, nt_s, nt_f ' +
                        'from user ' +
                        'where id = ?';
  // 이름, 사진 경로, 자기소개 업데이트
  var sql_update_user = 'update user ' +
                        'set name = ?, pf_path = ?, aboutme = ?, nt_fs = ?, nt_s = ?, nt_f = ? ' +
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
    function nullValueDefaulting(next) {
      conn.query(sql_select_user, [user.id], function(err, results) {
        if (err) {
          return next(err);
        }
        var originalUser = {}; // 원래 값을 넣을 객체
        originalUser.name = results[0].name;
        originalUser.pf_path = results[0].pf_path;
        originalUser.aboutme = results[0].aboutme;
        originalUser.nt_fs = results[0].nt_fs;
        originalUser.nt_s = results[0].nt_s;
        originalUser.nt_f = results[0].nt_f;

        next(null, originalUser);
      });
    }
    // 업데이트 실행
    function updateUser(originalUser, next) {
      // null일 경우 원래 값 세팅
      var name = user.name || originalUser.name;
      var pf_path = user.pf || originalUser.pf_path;
      var aboutme = user.aboutme || originalUser.aboutme;
      var nt_fs = user.nt_fs || originalUser.nt_fs;
      var nt_s = user.nt_s || originalUser.nt_s;
      var nt_f = user.nt_f || originalUser.nt_f;

      conn.query(sql_update_user, [name, pf_path, aboutme, nt_fs, nt_s, nt_f, user.id], function(err, result) {
        if (err) return next(err);
        // 이미지가 넘어왔을 경우 원본 이미지 삭제
        if (user.pf) {
          fs.unlink(originalUser.pf_path, function (err) {
            if (err) return next(err);
          });
        }
        next(null);
      });
    }
  });
};

// 알림 설정
module.exports.updateNotification = function(nt, callback) {
  var sql = '';
  if (nt.action === 'fs') sql = 'update user set nt_fs = ? where id = ?'; // 팔로잉 스크랩 알림
  else if (nt.action === 's') sql = 'update user set nt_s = ? where id = ?'; // 내 스크랩 좋아요 알림
  else if (nt.action === 'f') sql = 'update user set nt_f = ? where id = ?'; // 팔로우 알림

  dbPool.getConnection(function(err, conn) {
    if (err) return callback(err);

    conn.query(sql, [nt.state, nt.uid], function(err, result) {
      conn.release();
      if (err) return next(err);

      callback(null, {
        "result": "설정이 완료되었습니다."
      });
    });
  });
};

// 카테고리 목록
module.exports.listCategory = function(data, callback) {
  var sql = '';
  if (data.usage === 'scrap') { // 스크랩 페이지에서 보여지는 목록
    sql = 'select c.id, c.name ' +
          'from category c join user u on (u.id = c.user_id) ' +
          'where u.id = ? ' +
          'order by id ' +
          'limit ?, ?';
  } else if (data.usage === 'profile') { // 마이 페이지에서 보여지는 목록
    sql = 'select c.id, c.name, c.img_path, c.locked ' +
          'from category c join user u on (u.id = c.user_id) ' +
          'where u.id = ? ' +
          'order by id ' +
          'limit ?, ?';
  } else {
    callback(null, false); // 어느 쪽도 아닌 경우 404
  }

  dbPool.getConnection(function(err, conn) {
    if (err) return callback(err);

    conn.query(sql, [data.uid, data.count * (data.page - 1), data.count], function(err, results) {
      conn.release();
      if (err) return callback(err);

      async.map(results, function(item, done) {
        // 'profile'일 경우 img_url 생성
        if (data.usage === 'profile') {
          var img_url = '';
          if (item.img_path === 'default') {
            img_url = item.img_path;
          } else {
            var filename = path.basename(item.img_path);
            img_url = url.resolve(process.env.SERVER_HOST, '/images/' + filename);
          }
        }
        // 'scrap'일 경우 null값인 img_url, locked는 자동으로 없어진다.
        done(null, {
          "id": item.id,
          "name": item.name,
          "img_url": img_url,
          "locked": (item.locked === 1) ? true : false
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
  // 사용자 아이디, 카테고리 이름, 이미지 경로, 비공개 여부
  var sql = 'insert into category(user_id, name, img_path, locked) values(?, ?, ?, ?)';

  dbPool.getConnection(function(err, conn) {
    if (err) return callback(err);
    conn.query(sql, [category.uid, category.name, category.img, category.locked], function(err, result) {
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
  var sql_select_category = 'select name, img_path, locked ' +
                            'from category ' +
                            'where id = ?';
  // 이름, 이미지 경로, 비공개 여부 업데이트
  var sql_update_category = 'update category ' +
                            'set name = ?, img_path = ?, locked = ? ' +
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
    function nullValueDefaulting(next) {
      conn.query(sql_select_category, [category.cid], function(err, results) {
        if (err) return next(err);
        // 결과 값이 없을 경우 404
        if (results.length === 0) return callback(null, false);
        // 원래 값을 넣을 객체
        var originalUser = {};
        originalUser.name = results[0].name;
        originalUser.img_path = results[0].img_path;
        originalUser.locked = results[0].locked;

        next(null, originalUser);
      });
    }
    // 업데이트 실행
    function updateCategory(originalUser, next) {
      // null일 경우 원래 값 세팅
      var name = category.name || originalUser.name;
      var img_path = category.img_path || originalUser.img_path;
      var locked = category.locked || originalUser.locked;

      conn.query(sql_update_category, [name, img_path, locked, category.cid], function(err, result) {
        if (err) return next(err);
        // 이미지가 넘어왔을 경우 원본 이미지 삭제
        if (category.img_path) {
          fs.unlink(originalUser.img_path, function (err) {
            if (err) return next(err);
          });
        }
        next(null);
      });
    }
  });
};

// 카테고리 삭제
module.exports.removeCategory = function(id, callback) {
  // 해당 카테고리에 스크랩 검색
  var sql_select_scrap = 'select id from scrap where category_id = ?';
  // 검색된 스크랩 id로 favorite 삭제
  var sql_delete_favorite = 'delete from favorite where scrap_id in (?)';
  // 검색된 스크랩 id로 scrap_tag 삭제
  var sql_delete_scrap_tag = 'delete from scrap_tag where scrap_id in (?)';
  // 스크랩 삭제
  var sql_delete_scrap = 'delete from scrap where category_id = ?';
  // 삭제 전 이미지 경로를 찾는 쿼리
  var sql_select_category_img = 'select img_path from category where id = ?';
  // 카테고리 삭제하는 쿼리
  var sql_delete_category = 'delete from category where id = ?';

  dbPool.getConnection(function(err, conn) {
    if (err) return callback(err);

    var scrap_ids = [];
    var img_path = ''; // 삭제 전 이미지 경로
    conn.beginTransaction(function (err) {
      if (err) {
        conn.release();
        return callback(err);
      }
      // db에서 카테고리 삭제 후 실제 이미지 파일 삭제
      // db는 rollback이 되지만 파일은 안되기 때문에...
      async.series([findScrapIds, removeFavoriteAndScrapTag, removeScrap, findImagePath, removeCategory, removeImage], function(err) {
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
    // 스크랩 아이디 검색
    function findScrapIds(next) {
      conn.query(sql_select_scrap, [id], function(err, results) {
        if (err) return next(err);
        if (results.length === 0) return next(null);
        async.each(results, function(item, done) {
          scrap_ids.push(item.id);
          done(null);
        }, function(err) {
          if(err) return next(err);
          next(null);
        });
      });
    }
    // favorite와 scrap_tag 삭제 병렬 처리
    function removeFavoriteAndScrapTag(next) {
      async.parallel([removeFavorite, removeScrapTag], function(err) {
        if (err) next(err);
        next(null);
      });
    }
    // favorite 삭제
    function removeFavorite(done) {
      conn.query(sql_delete_favorite, [scrap_ids], function(err) {
        if (err) return done(err);
        done(null);
      });
    }
    // scrap_tag 삭제
    function removeScrapTag(done) {
      conn.query(sql_delete_scrap_tag, [scrap_ids], function(err) {
        if (err) return done(err);
        done(null);
      });
    }
    // scrap 삭제
    function removeScrap(next) {
      conn.query(sql_delete_scrap, [id], function(err) {
        if (err) return next(err);
        next(null);
      });
    }
    // 이미지 path 찾기
    function findImagePath(next) {
      conn.query(sql_select_category_img, [id], function(err, results) {
        if (err) return next(err);
        // 결과 값이 없을 경우 404
        if (results.length === 0) return callback(null, false);
        img_path = results[0].img_path; // removeImage 함수에서 쓰임
        next(null);
      });
    }
    // 카테고리 삭제
    function removeCategory(next) {
      conn.query(sql_delete_category, [id], function(err, results) {
        if (err) return next(err);
        next(null);
      });
    }
    // 실제 이미지 파일 삭제
    function removeImage(next) {
      if (img_path === 'default') return next(null);
      fs.unlink(img_path, function (err) {
        if (err) return next(err);
        next(null);
      });
    }
  });
};
