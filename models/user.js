var dbPool = require('../models/common').dbPool;

module.exports.findByNameAndProfileUrl = function(id, callback) {
  callback(null, {
    name: "이임수",
    pf_url: "http://…/images/user/id/pf_picture.bmp"
  });
};

module.exports.findUser = function(id, callback) {
  callback(null, {
    "result": {
      "name": "이름",
      "pf_url": "http://.../images/user/id/pf_picture.bmp",
      "aboutme" : "자기소개",
      "scrapings" : 1,
      "followings" : 1,
      "followers" : 1,
    }
  });
};

module.exports.findOrCreate = function(profile, callback) {
  callback(null, 'facebook:123456789101112');
};

module.exports.updateUser = function(user, callback) {
  callback();
};

