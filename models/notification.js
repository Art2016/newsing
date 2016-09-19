var dbPool = require('../common/dbpool');
var async = require('async');

module.exports.listNotification = function(uid, page, count, callback) {
  var sql = 'select type, message, data_pk, date_format(convert_tz(dtime, "+00:00", "+09:00"), "%Y-%m-%d %H:%i:%s") dtime ' +
            'from notification ' +
            'where user_id_r = ? ' +
            'order by dtime desc, id desc ' +
            'limit ?, ?';

  dbPool.logStatus();
  dbPool.getConnection(function(err, conn) {
    if (err) return callback(err);

    conn.query(sql, [uid, count * (page - 1), count], function(err, results) {
      conn.release();
      dbPool.logStatus();
      if (err) return callback(err);
      // 값이 없을 경우 빈 배열
      if (results.length === 0) return callback(null, []);

      async.map(results, function(item, done) {
        done(null, {
          type: item.type,
          message: item.message,
          data_pk: item.data_pk,
          dtime: item.dtime
        });
      }, function(err, notifications) {
        if (err) callback(err);
        callback(null, notifications);
      });
    });
  });
};
