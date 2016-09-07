var dbPool = require('../common/dbpool');
var async = require('async');

// 키워드 목록
module.exports.listKeyword = function(callback) {
  var sql = 'select id, word from keyword where ktime >= CURDATE() order by id;';

  dbPool.getConnection(function(err, conn) {
    if (err) return callback(err);
    conn.query(sql, [], function (err, results) {
      conn.release();
      if (err) return callback(err);
      var keywords = {};
      keywords['results'] = [];
      if (results.length === 0) callback(null, keywords);
      async.each(results, function(item, done) {
        keywords.results.push({
          id: item.id,
          keyword: item.word
        });

        done(null);
      }, function(err) {
        if (err) return callback(err);
        callback(null, keywords);
      });
    });
  });
};
