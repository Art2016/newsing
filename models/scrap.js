var dbPool = require('../models/common').dbPool;

module.exports.createScrap = function(scrap, callback) {
  // 1. 스크랩 저장
  // 2. insertId로 태그들 저장
  callback(null, {
      "result": "스크랩을 완료하였습니다."
    }
  );
};

module.exports.listScrap = function(data, callback) {
  callback({
    "results": [
      {
        "id" : 1,
        "title" : "스크랩 제목",
        "nc_title": "블리자드, '워크래프트' 무기 실제 제작 과정 공개",
        "nc_img_url" : "http://.../images/newscontents/20160821.bmp",
        "nc_author": "뉴스 컨텐츠 언론사",
        "nc_dtime": "2016-08-23 13:22:33",
        "favorite_cnt" : 1,
        "favorite": true,
        "private" : true
      },
      {
        "id" : 2,
        "title" : "스크랩 제목",
        "nc_title": "드래곤플라이, '스페셜포스 AR' 테스트 영상 공개",
        "nc_img_url" : "http://.../images/newscontents/20160821.bmp",
        "nc_author": "뉴스 컨텐츠 언론사",
        "nc_dtime": "2016-08-23 13:22:33",
        "favorite_cnt" : 1,
        "favorite": false,
        "private" : true
      },
      {
        "id" : 3,
        "title" : "스크랩 제목",
        "nc_title": "블록체인으로 해외송금, 수수료 5분의1로 한 시간 내 OK",
        "nc_img_url" : "http://.../images/newscontents/20160821.bmp",
        "nc_author": "뉴스 컨텐츠 언론사",
        "nc_dtime": "2016-08-23 13:22:33",
        "favorite_cnt" : 1,
        "favorite": true,
        "private" : false
      },
      {
        "id" : 4,
        "title" : "스크랩 제목",
        "nc_title": "단통법 개선안 '봇물'... 실현 가능성은?",
        "nc_img_url" : "http://.../images/newscontents/20160821.bmp",
        "nc_author": "뉴스 컨텐츠 언론사",
        "nc_dtime": "2016-08-23 13:22:33",
        "favorite_cnt" : 1,
        "favorite": true,
        "private" : true
      },
      {
        "id" : 5,
        "title" : "스크랩 제목",
        "nc_title": "스마트시티, 정부가 앞장서지 마라",
        "nc_img_url" : "http://.../images/newscontents/20160821.bmp",
        "nc_author": "뉴스 컨텐츠 언론사",
        "nc_dtime": "2016-08-23 13:22:33",
        "favorite_cnt" : 1,
        "favorite": false,
        "private" : false
      },
      {
        "id" : 6,
        "title" : "스크랩 제목",
        "nc_title": "비타브리드C12, 美 미용 전시회서 트렌드세터상 수상",
        "nc_img_url" : "http://.../images/newscontents/20160821.bmp",
        "nc_author": "뉴스 컨텐츠 언론사",
        "nc_dtime": "2016-08-23 13:22:33",
        "favorite_cnt" : 1,
        "favorite": true,
        "private" : true
      },
      {
        "id" : 7,
        "title" : "스크랩 제목",
        "nc_title": "나이키는 왜 골프 장비사업 접었나",
        "nc_img_url" : "http://.../images/newscontents/20160821.bmp",
        "nc_author": "뉴스 컨텐츠 언론사",
        "nc_dtime": "2016-08-23 13:22:33",
        "favorite_cnt" : 1,
        "favorite": false,
        "private" : true
      },
      {
        "id" : 8,
        "title" : "스크랩 제목",
        "nc_title": "금융권 클라우드 도입, 핀테크가 이끈다",
        "nc_img_url" : "http://.../images/newscontents/20160821.bmp",
        "nc_author": "뉴스 컨텐츠 언론사",
        "nc_dtime": "2016-08-23 13:22:33",
        "favorite_cnt" : 1,
        "favorite": false,
        "private" : true
      },
      {
        "id" : 9,
        "title" : "스크랩 제목",
        "nc_title": "단말기 지원금 상한제, '일몰' 앞당겨야",
        "nc_img_url" : "http://.../images/newscontents/20160821.bmp",
        "nc_author": "뉴스 컨텐츠 언론사",
        "nc_dtime": "2016-08-23 13:22:33",
        "favorite_cnt" : 1,
        "favorite": true,
        "private" : true
      },
      {
        "id" : 10,
        "title" : "스크랩 제목",
        "nc_title": "니콘, 신제품 DSLR 'D3400' 내달 출시",
        "nc_img_url" : "http://.../images/newscontents/20160821.bmp",
        "nc_author": "뉴스 컨텐츠 언론사",
        "nc_dtime": "2016-08-23 13:22:33",
        "favorite_cnt" : 1,
        "favorite": true,
        "private" : false
      }
    ]
  });
};

module.exports.removeScrap = function(id, callback) {
  callback(null, {
    "result": "스크랩 삭제가 완료되었습니다."
  });
};

module.exports.updateScrap = function(scrap, callback) {
  callback(null, {
    "result": "스크랩 수정이 완료되었습니다."
  });
};

module.exports.findScrap = function(id, callback) {
  callback(null, {
    "result": {
      "title": "제목" + id,
      "nc_title": "금융권 클라우드 도입, 핀테크가 이끈다",
      "nc_contents": "지난해 9월 클라우드 컴퓨팅 발전법이 시행된 이후 지지부진했던 금융권 클라우드 서비스 도입 활성화에 핀테크가 마중물 역할을 하게 됐다. NH농협은행은 지난해 말부터 좋은 아이디어를 가진 핀테크 기업들에게 자사 금융API를 열어줘 서비스를 보다 쉽고 빠르게 연동시킬 수 있게 돕는 NH 핀테크 오픈플랫폼을 설립, 운영 중이다.",
      "nc_img_url": "http://.../images/newscontents/20160821_id.bmp",
      "nc_link": "http://www.zdnet.co.kr/news/news_view.asp?artice_id=20160823161828",
      "contents": "스크랩 내용",
      "img_url": "http://.../images/scraps/20160821_id.bmp",
      "favorite_cnt": 1,
      "favorite": true,
      "tags": ["tag1", "tag2", "tag3"]
    }
  });
};

module.exports.createFavorites = function(uid, sid, callback) {
  callback(null, {
    "result": "\"좋아요\" 이모티콘이 활성화되었습니다."
  });
};

module.exports.removeFavorites = function(uid, sid, callback) {
  callback(null, {
      "result": "\"좋아요\" 이모티콘이 해제되었습니다."
  });
};