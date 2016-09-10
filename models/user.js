var dbPool = require('../common/dbpool');
var fs = require('fs');
var async = require('async');
var path = require('path');
var url = require('url');

// 사용자의 이름과 사진 경로 조회
module.exports.findByNameAndProfileUrlAndNotifications = function(id, callback) {
  var sql = 'select name, pf_path, nt_fs, nt_s, nt_f from user where id = ?';

  dbPool.logStatus();
  dbPool.getConnection(function(err, conn) {
    if (err) return callback(err);
    conn.query(sql, [id], function (err, results) {
      conn.release();
      dbPool.logStatus();
      if (err) return callback(err);
      // 결과 값이 없을 경우 404
      if (results.length === 0) return callback(null, false);
      // 결과 값을 user객체에 담기
      var user = {};
      user.id = id;
      user.name = results[0].name;
      user.nt_fs = results[0].nt_fs;
      user.nt_s = results[0].nt_s;
      user.nt_f = results[0].nt_f;
      // http로 시작하면 페이스북 사진
      if(results[0].pf_path.match(/http.+/i)) {
        user.pf_url = results[0].pf_path;
      } else { // 파일에 접근할 url 생성
        var filename = path.basename(results[0].pf_path);
        user.pf_url = url.resolve(process.env.SERVER_HOST, '/images/profile/' + filename);
      }
      callback(null, user);
    });
  });
};

// 사용자 조회
module.exports.findUser = function(uid, ouid, callback) {
  var sql = '';
  var values = [];

  if (ouid === '') {
    // 이름, 프로필 사진 경로, 자기 소개, 스크랩 수, 팔로잉 수, 팔로워 수
    sql = 'select name, pf_path, aboutme, scrapings, followings, followers ' +
          'from user ' +
          'where id = ?';
    values.push(uid);
  } else {
    // 타인일 때 팔로우 여부 추가
    sql = 'select name, pf_path, aboutme, scrapings, followings, followers, case when f.user_id_o is not null then 1 else 0 end flag ' +
          'from user u left join (select user_id_o from follow where user_id = ?) f on (u.id = f.user_id_o) ' +
          'where id = ?';
    values.push(uid);
    values.push(ouid);
  }

  dbPool.logStatus();
  dbPool.getConnection(function(err, conn) {
    if (err) return callback(err);

    conn.query(sql, values, function (err, results) {
      conn.release();
      dbPool.logStatus();
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
        user.pf_url = url.resolve(process.env.SERVER_HOST, '/images/profile/' + filename);
      }
      user.aboutme = results[0].aboutme || ''; // null이 허용된 속성
      user.scrapings = results[0].scrapings;
      user.followings = results[0].followings;
      user.followers = results[0].followers;
      // 타인일 때 팔로우 체크
      if (ouid !== '') {
        user.flag = (results[0].flag === 1) ? true : false;
      }

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

  dbPool.logStatus();
  dbPool.getConnection(function(err, conn) {
    if (err) return callback(err);
    // 이미 있는 사용자인지 조회
    conn.query(sql_facebookid, [profile.id], function(err, results) {
      if (err) {
        conn.release();
        dbPool.logStatus();
        return callback(err);
      }
      // 사용자가 이미 있다면...
      if (results.length !== 0) {
        conn.release();
        dbPool.logStatus();
        // 결과 값을 user객체에 담기
        var user = {};
        user.id = results[0].id;
        user.name = results[0].name;
        // http로 시작하면 페이스북 사진
        if(results[0].pf_path.match(/http.+/i)) {
          user.pf_url = results[0].pf_path;
        } else { // 파일에 접근할 url 생성
          var filename = path.basename(results[0].pf_path);
          user.pf_url = url.resolve(process.env.SERVER_HOST, '/images/profile/' + filename);
        }
        user.nt_fs = (results[0].nt_fs === 1) ? true : false;
        user.nt_s = (results[0].nt_s === 1) ? true : false;
        user.nt_f = (results[0].nt_f === 1) ? true : false;
        return callback(null, user);
      }
      // 없으면 생성...
      conn.query(sql_insert_facebookid, [profile.id, profile.displayName, profile.photos[0].value], function(err) {
        conn.release();
        dbPool.logStatus();
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

// 토큰값 업데이트
module.exports.updateToken = function(token, id, callback) {
  //로그인할 때마다 토큰값 업데이트
  var sql = 'update user set fcm_token = ? where id = ?';

  dbPool.logStatus();
  dbPool.getConnection(function(err, conn) {
    if (err) return callback(err);

    conn.query(sql, [token, id], function(err) {
      conn.release();
      dbPool.logStatus();
      if (err) callback(err);
      callback(null);
    })
  });
};

// 사용자 정보 업데이트
module.exports.updateUser = function(uid, user, callback) {
  // 프로필 경로 값
  var sql_select_user_pf_path = 'select pf_path ' +
                                'from user ' +
                                'where id = ?';
  // 이름, 사진 경로, 자기소개 업데이트
  var sql_update_user = 'update user ' +
                        'set ? ' +
                        'where id = ?';

  dbPool.logStatus();
  dbPool.getConnection(function(err, conn) {
    if (err) return callback(err);
    // 쿼리실행은 rollback이 되지만 파일은 안되기 때문에
    // 트랜잭션으로 파일 삭제 실패시 rollback!!
    conn.beginTransaction(function (err) {
      if (err) {
        conn.release();
        dbPool.logStatus();
        return callback(err);
      }
      async.waterfall([getProfilePath, updateUser], function(err) {
        if (err) {
          return conn.rollback(function () {
            conn.release();
            dbPool.logStatus();
            callback(err);
          });
        }
        conn.commit(function () {
          conn.release();
          dbPool.logStatus();
          callback(null, {
            "result": "수정이 완료되었습니다."
          });
        });
      });
      // 프로필 경로 값 얻어오기
      function getProfilePath(next) {
        conn.query(sql_select_user_pf_path, [uid], function(err, results) {
          if (err) return next(err);
          if (results.length === 0) {
            conn.release();
            dbPool.logStatus();
            callback(null, false);
          }
          next(null, results[0].pf_path);
        });
      }
      // 사용자 업데이트
      function updateUser(pf_path, next) {
        conn.query(sql_update_user, [user, uid], function(err) {
          if (err) return next(err);
          // 삭제할 필요가 없는 경우
          if (pf_path.match(/http.+/i)){
            return next(null);
          }
          // 이미지가 넘어왔을 경우 원본 이미지 삭제
          if (user.pf_path) {
            fs.unlink(pf_path, function (err) {
              if (err) return next(err);
              next(null);
            });
          } else {
            next(null);
          }
        });
      }
    });
  });
};

// 알림 설정
module.exports.updateNotification = function(uid, nt, callback) {
  // 알림 업데이트
  var sql = 'update user set ? where id = ?';

  dbPool.logStatus();
  dbPool.getConnection(function(err, conn) {
    if (err) return callback(err);

    conn.query(sql, [nt, uid], function(err) {
      conn.release();
      dbPool.logStatus();
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
  } else if (data.usage === 'profile' && data.me === true) { // 마이 페이지에서 보여지는 목록(나일 때)
    sql = 'select c.id, c.name, c.img_path, c.locked ' +
          'from category c join user u on (u.id = c.user_id) ' +
          'where u.id = ? ' +
          'order by id ' +
          'limit ?, ?';
  } else if (data.usage === 'profile' && data.me === false) { // 마이 페이지에서 보여지는 목록(타인일 때)
    sql = 'select c.id, c.name, c.img_path, c.locked ' +
          'from category c join user u on (u.id = c.user_id) ' +
          'where u.id = ? and c.locked = 0 ' +
          'order by id ' +
          'limit ?, ?';
  } else {
    callback(null, false); // 어느 쪽도 아닌 경우 404
  }
  dbPool.logStatus();
  dbPool.getConnection(function(err, conn) {
    if (err) return callback(err);

    conn.query(sql, [data.uid, data.count * (data.page - 1), data.count], function(err, results) {
      conn.release();
      dbPool.logStatus();
      if (err) return callback(err);

      async.map(results, function(item, done) {
        // 'profile'일 경우 img_url 생성
        if (data.usage === 'profile') {
          var img_url = '';
          if (item.img_path === 'default') {
            img_url = item.img_path;
          } else {
            var filename = path.basename(item.img_path);
            img_url = url.resolve(process.env.SERVER_HOST, '/images/category/' + filename);
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

  dbPool.logStatus();
  dbPool.getConnection(function(err, conn) {
    if (err) return callback(err);
    conn.query(sql, [category.uid, category.name, category.img, category.locked], function(err) {
      conn.release();
      dbPool.logStatus();
      if (err) return callback(err);

      callback(null, {
        "result": "카테고리 생성이 완료되었습니다."
      });
    });
  });
};

// 카테고리 업데이트
module.exports.updateCategory = function(cid, uid, category, callback) {
  // 카테고리 이미지 경로
  var sql_select_category_img_path = 'select user_id, img_path ' +
                            'from category ' +
                            'where id = ?';
  // 이름, 이미지 경로, 비공개 여부 업데이트
  var sql_update_category = 'update category ' +
                            'set ? ' +
                            'where id = ?';

  dbPool.logStatus();
  dbPool.getConnection(function(err, conn) {
    if (err) return callback(err);
    // 쿼리실행은 rollback이 되지만 파일은 안되기 때문에
    // 트랜잭션으로 파일 삭제 실패시 rollback!!
    conn.beginTransaction(function (err) {
      if (err) {
        conn.release();
        dbPool.logStatus();
        return callback(err);
      }

      async.waterfall([getImagePath, updateCategory], function (err) {
        if (err) {
          return conn.rollback(function () {
            conn.release();
            dbPool.logStatus();
            callback(err);
          });
        }
        conn.commit(function () {
          conn.release();
          dbPool.logStatus();
          callback(null, {
            "result": "수정이 완료되었습니다."
          });
        });
      });
    });
    // 이미지 경로 값 얻어오기
    function getImagePath(next) {
      conn.query(sql_select_category_img_path, [cid], function(err, results) {
        if (err) return next(err);
        // 결과 값이 없을 경우 404
        if (results.length === 0) {
          return conn.rollback(function () {
            conn.release();
            dbPool.logStatus();
            callback(null, false);
          });
        }
        // 내 카테고리인지 체크, 아니면 403 처리
        if (results[0].user_id !== uid) {
          return conn.rollback(function () {
            conn.release();
            dbPool.logStatus();
            callback(null, '403');
          });
        }

        next(null, results[0].img_path);
      });
    }
    // 업데이트 실행
    function updateCategory(img_path, next) {
      conn.query(sql_update_category, [category, cid], function(err) {
        if (err) return next(err);
        // 삭제할 필요가 없는 경우
        if (img_path === 'default') return next(null);
        // 이미지가 넘어왔을 경우 원본 이미지 삭제
        if (category.img_path) {
          fs.unlink(img_path, function (err) {
            if (err) return next(err);
            next(null);
          });
        } else {
          next(null);
        }
      });
    }
  });
};

// 카테고리 삭제
module.exports.removeCategory = function(cid, uid, callback) {
  // 카테고리 user_id 찾기
  var sql_select_category_user_id = 'select user_id from category where id = ?';
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

  dbPool.logStatus();
  dbPool.getConnection(function(err, conn) {
    if (err) return callback(err);

    var scrap_ids = [];
    var img_path = ''; // 삭제 전 이미지 경로
    conn.beginTransaction(function (err) {
      if (err) {
        conn.release();
        dbPool.logStatus();
        return callback(err);
      }
      // db에서 카테고리 삭제 후 실제 이미지 파일 삭제
      // db는 rollback이 되지만 파일은 안되기 때문에...
      async.series([
        checkMyCategory,
        findScrapIds,
        removeFavoriteAndScrapTag,
        removeScrap,
        findImagePath,
        removeCategory,
        removeImage
      ], function(err) {
        if (err) {
          return conn.rollback(function () {
            conn.release();
            dbPool.logStatus();
            callback(err);
          });
        }
        conn.commit(function () {
          conn.release();
          dbPool.logStatus();
          callback(null, {
            "result": "카테고리 삭제가 완료되었습니다."
          });
        });
      });
    });
    // 내 카테고리인지 체크
    function checkMyCategory(next) {
      conn.query(sql_select_category_user_id, [cid], function(err, results) {
        if (err) return next(err);
        // 결과 값이 없을 경우 404
        if (results.length === 0) {
          return conn.rollback(function() {
            conn.release();
            dbPool.logStatus();
            callback(null, false);
          });
        }
        // 내 카테고리인지 체크, 아니면 403 처리
        if (results[0].user_id !== uid) {
          return conn.rollback(function() {
            conn.release();
            dbPool.logStatus();
            callback(null, '403');
          });
        }

        next(null);
      });
    }
    // 스크랩 아이디 검색
    function findScrapIds(next) {
      conn.query(sql_select_scrap, [cid], function(err, results) {
        if (err) return next(err+111);
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
        if (err) return next(err);
        next(null);
      });
    }
    // favorite 삭제
    function removeFavorite(done) {
      if (scrap_ids.length === 0) return done(null); // 스크랩이 없을 때

      conn.query(sql_delete_favorite, [scrap_ids], function(err) {
        if (err) return done(err);
        done(null);
      });
    }
    // scrap_tag 삭제
    function removeScrapTag(done) {
      if (scrap_ids.length === 0) return done(null); // 스크랩이 없을 때

      conn.query(sql_delete_scrap_tag, [scrap_ids], function(err) {
        if (err) return done(err);
        done(null);
      });
    }
    // scrap 삭제
    function removeScrap(next) {
      conn.query(sql_delete_scrap, [cid], function(err) {
        if (err) return next(err);
        next(null);
      });
    }
    // 이미지 path 찾기
    function findImagePath(next) {
      conn.query(sql_select_category_img, [cid], function(err, results) {
        if (err) return next(err);
        // 결과 값이 없을 경우 404
        if (results.length === 0) {
          return conn.rollback(function() {
            conn.release();
            dbPool.logStatus();
            callback(null, false);
          });
        }
        img_path = results[0].img_path; // removeImage 함수에서 쓰임
        next(null);
      });
    }
    // 카테고리 삭제
    function removeCategory(next) {
      conn.query(sql_delete_category, [cid], function(err) {
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
