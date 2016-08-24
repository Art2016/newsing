var dbPool = require('../models/common').dbPool;

module.exports.findByNameAndProfileUrl = function(id, callback) {
  callback(null, {
    "name": "이임수",
    "pf_url": "http://…/images/user/id/pf_picture.bmp"
  });
};

module.exports.findUser = function(id, callback) {
  callback(null, {
    "result": {
      "name": "서창욱",
      "pf_url": "http://.../images/user/id/pf_picture.bmp",
      "aboutme" : "안녕하세요. 저는 코딩이 취미입니다.",
      "scrapings" : 1,
      "followings" : 1,
      "followers" : 1,
    }
  });
};

module.exports.findOrCreate = function(profile, callback) {
  callback(null, profile.id);
};

module.exports.updateUser = function(user, callback) {
  if (user.name) {

  }
  if (user.pf) {

  }
  if (user.aboutme) {

  }
  callback(null, {
    "result": "수정이 완료되었습니다."
  });
};

module.exports.listCategory = function(data, callback) {
  var categories = {};
  if (data.usage === 'scrap') {
    categories = {
      "results": [
        {
          "id": 1,
          "name": "카테고리 이름",
        },
        {
          "id": 2,
          "name": "컴퓨터",
        },
        {
          "id": 3,
          "name": "신기한 것",
        },
        {
          "id": 4,
          "name": "프로그래밍",
        },
        {
          "id": 5,
          "name": "스타트 업",
        },
        {
          "id": 6,
          "name": "하드웨어",
        },
        {
          "id": 7,
          "name": "구글",
        },
        {
          "id": 8,
          "name": "삼성",
        },
        {
          "id": 9,
          "name": "중국",
        },
        {
          "id": 10,
          "name": "스마트 폰",
        }
      ]
    }
  } else if (data.usage === 'profile') {
    categories = {
      "results": [
        {
          "id": 1,
          "name": "카테고리 이름",
          "img_url": "http://…/images/user/id/categories/category_name.bmp",
          "private": true
        },
        {
          "id": 2,
          "name": "컴퓨터",
          "img_url": "http://…/images/user/id/categories/category_name.bmp",
          "private": true
        },
        {
          "id": 3,
          "name": "신기한 것",
          "img_url": "http://…/images/user/id/categories/category_name.bmp",
          "private": false
        },
        {
          "id": 4,
          "name": "프로그래밍",
          "img_url": "http://…/images/user/id/categories/category_name.bmp",
          "private": true
        },
        {
          "id": 5,
          "name": "스타트 업",
          "img_url": "http://…/images/user/id/categories/category_name.bmp",
          "private": true
        },
        {
          "id": 6,
          "name": "하드웨어",
          "img_url": "http://…/images/user/id/categories/category_name.bmp",
          "private": false
        },
        {
          "id": 7,
          "name": "구글",
          "img_url": "http://…/images/user/id/categories/category_name.bmp",
          "private": true
        },
        {
          "id": 8,
          "name": "삼성",
          "img_url": "http://…/images/user/id/categories/category_name.bmp",
          "private": false
        },
        {
          "id": 9,
          "name": "중국",
          "img_url": "http://…/images/user/id/categories/category_name.bmp",
          "private": true
        },
        {
          "id": 10,
          "name": "스마트 폰",
          "img_url": "http://…/images/user/id/categories/category_name.bmp",
          "private": true
        }
      ]
    }
  }
  callback(null, categories);
};

module.exports.createCategory = function(category, callback) {
  callback(null, {
    "result": "카테고리 생성이 완료되었습니다."
  });
};

module.exports.updateCategory = function(category, callback) {
  if (category.name) {

  }
  if (category.img) {

  }
  if (category.private) {

  }
  callback(null, {
    "result": "수정이 완료되었습니다."
  });
};

module.exports.removeCategory = function(id, callback) {
  callback(null, {
    "result": "카테고리 삭제가 완료되었습니다."
  });
};
