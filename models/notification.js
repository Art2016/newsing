var dbPool = require('../common/dbpool');

module.exports.listNotification = function(page, count, callback) {
  callback(null, {
    "results": [
      {
        "message": "A님이 팔로우하였습니다.",
        "data_pk": 1,
        "dtime": "2016-08-22 01:34:15",
      },
      {
        "message": "B님이 내 스크랩을 좋아합니다.",
        "data_pk": 2,
        "dtime": "2016-08-22 02:44:25",
      },
      {
        "message": "C님이 팔로우하였습니다.",
        "data_pk": 3,
        "dtime": "2016-08-22 05:33:35",
      },
      {
        "message": "D님이 새 스크랩을 올렸습니다.",
        "data_pk": 4,
        "dtime": "2016-08-22 07:33:25",
      },
      {
        "message": "E님이 내 스크랩을 좋아합니다.",
        "data_pk": 5,
        "dtime": "2016-08-22 09:34:25",
      },
    ]
  })
};

module.exports.createAndPush = function(type, data_pk, ids, callback) {
  // 메시지 생성
  // 푸시
  // 저장
  callback({
    "results": "알림을 보내는데 성공하였습니다."
  });
};
