module.exports.findNewscontents = function(data, callback) {
  callback(null, {
    "results": [
      {
        "id": 1,
        "title": "니콘, 신제품 DSLR 'D3400' 내달 출시",
        "author": "언론사",
        "ntime": "2016-08-23 13:22:33"
      },
      {
        "id": 2,
        "title": "삼성 약진…스마트폰 수익점유율 30% 돌파",
        "author": "언론사",
        "ntime": "2016-08-23 13:22:33"
      },
      {
        "id": 3,
        "title": "구글, 국내 비영리 단체 10곳에 35억원 지원",
        "author": "언론사",
        "ntime": "2016-08-23 13:22:33"
      },
      {
        "id": 4,
        "title": "4차산업혁명 원동력은 소프트파워",
        "author": "언론사",
        "ntime": "2016-08-23 13:22:33"
      },
      {
        "id": 5,
        "title": "최재유 차관 “'알파고 쇼크', AI 발전 정부가 주도”",
        "author": "언론사",
        "ntime": "2016-08-23 13:22:33"
      },
      {
        "id": 6,
        "title": "인포마크, 독일·노르웨이·베트남에 키즈폰 출시",
        "author": "언론사",
        "ntime": "2016-08-23 13:22:33"
      },
      {
        "id": 7,
        "title": "할리데이비슨, 스타필드 하남에 부티크 매장 연다",
        "author": "언론사",
        "ntime": "2016-08-23 13:22:33"
      },
      {
        "id": 8,
        "title": "팔팔게임즈, 웹게임 '무극천하' 25일 CBT 시작",
        "author": "언론사",
        "ntime": "2016-08-23 13:22:33"
      },
      {
        "id": 9,
        "title": "엘케이오토, 英 스포츠카 로터스 할인 판매",
        "author": "언론사",
        "ntime": "2016-08-23 13:22:33"
      },
      {
        "id": 10,
        "title": "이엔피게임즈, ‘블레이블루’ 사전예약 20만명 돌파",
        "author": "언론사",
        "ntime": "2016-08-23 13:22:33"
      }
    ]
  });
};

module.exports.findUsers = function(data, callback) {
  callback(null, {
    "results": [
      {
        "id": 1,
        "pf_url": "http://.../images/user/id/pf_picture.bmp",
        "name": "이임수",
        "aboutme": "사용자 자기소개"
      },
      {
        "id": 2,
        "pf_url": "http://.../images/user/id/pf_picture.bmp",
        "name": "서창욱",
        "aboutme": "사용자 자기소개"
      },
      {
        "id": 3,
        "pf_url": "http://.../images/user/id/pf_picture.bmp",
        "name": "임지수",
        "aboutme": "사용자 자기소개"
      },
      {
        "id": 4,
        "pf_url": "http://.../images/user/id/pf_picture.bmp",
        "name": "신미은",
        "aboutme": "사용자 자기소개"
      },
      {
        "id": 5,
        "pf_url": "http://.../images/user/id/pf_picture.bmp",
        "name": "이혜람",
        "aboutme": "사용자 자기소개"
      },
      {
        "id": 6,
        "pf_url": "http://.../images/user/id/pf_picture.bmp",
        "name": "정다솜",
        "aboutme": "사용자 자기소개"
      },
      {
        "id": 7,
        "pf_url": "http://.../images/user/id/pf_picture.bmp",
        "name": "김예진",
        "aboutme": "사용자 자기소개"
      },
      {
        "id": 8,
        "pf_url": "http://.../images/user/id/pf_picture.bmp",
        "name": "사용자 이름",
        "aboutme": "사용자 자기소개"
      }
    ]
  });
};

module.exports.findTags = function(data, callback) {
  callback(null, {
    "results": [
      {
        id: 1,
        tag: "tag1"
      },
      {
        id: 2,
        tag: "tag2"
      },
      {
        id: 3,
        tag: "tag3"
      },
      {
        id: 4,
        tag: "tag4"
      },
      {
        id: 5,
        tag: "tag5"
      },
    ]
  });
};

module.exports.findScraps = function(data, callback) {
  callback(null, {
    "results": [
      {
        "id" : 1,
        "title" : "스크랩 제목",
        "nc_title": "블리자드, '워크래프트' 무기 실제 제작 과정 공개",
        "nc_img_url" : "http://.../images/newscontents/20160821.bmp",
        "nc_author": "뉴스 컨텐츠 언론사",
        "nc_dtime": "2016-08-23 13:22:33",
        "favorite_cnt" : 1,
        "favorite": true
      },
      {
        "id" : 2,
        "title" : "스크랩 제목",
        "nc_title": "드래곤플라이, '스페셜포스 AR' 테스트 영상 공개",
        "nc_img_url" : "http://.../images/newscontents/20160821.bmp",
        "nc_author": "뉴스 컨텐츠 언론사",
        "nc_dtime": "2016-08-23 13:22:33",
        "favorite_cnt" : 1,
        "favorite": false
      },
      {
        "id" : 3,
        "title" : "스크랩 제목",
        "nc_title": "블록체인으로 해외송금, 수수료 5분의1로 한 시간 내 OK",
        "nc_img_url" : "http://.../images/newscontents/20160821.bmp",
        "nc_author": "뉴스 컨텐츠 언론사",
        "nc_dtime": "2016-08-23 13:22:33",
        "favorite_cnt" : 1,
        "favorite": true
      },
      {
        "id" : 4,
        "title" : "스크랩 제목",
        "nc_title": "단통법 개선안 '봇물'... 실현 가능성은?",
        "nc_img_url" : "http://.../images/newscontents/20160821.bmp",
        "nc_author": "뉴스 컨텐츠 언론사",
        "nc_dtime": "2016-08-23 13:22:33",
        "favorite_cnt" : 1,
        "favorite": true
      },
      {
        "id" : 5,
        "title" : "스크랩 제목",
        "nc_title": "스마트시티, 정부가 앞장서지 마라",
        "nc_img_url" : "http://.../images/newscontents/20160821.bmp",
        "nc_author": "뉴스 컨텐츠 언론사",
        "nc_dtime": "2016-08-23 13:22:33",
        "favorite_cnt" : 1,
        "favorite": false
      },
      {
        "id" : 6,
        "title" : "스크랩 제목",
        "nc_title": "비타브리드C12, 美 미용 전시회서 트렌드세터상 수상",
        "nc_img_url" : "http://.../images/newscontents/20160821.bmp",
        "nc_author": "뉴스 컨텐츠 언론사",
        "nc_dtime": "2016-08-23 13:22:33",
        "favorite_cnt" : 1,
        "favorite": true
      },
      {
        "id" : 7,
        "title" : "스크랩 제목",
        "nc_title": "나이키는 왜 골프 장비사업 접었나",
        "nc_img_url" : "http://.../images/newscontents/20160821.bmp",
        "nc_author": "뉴스 컨텐츠 언론사",
        "nc_dtime": "2016-08-23 13:22:33",
        "favorite_cnt" : 1,
        "favorite": false
      },
      {
        "id" : 8,
        "title" : "스크랩 제목",
        "nc_title": "금융권 클라우드 도입, 핀테크가 이끈다",
        "nc_img_url" : "http://.../images/newscontents/20160821.bmp",
        "nc_author": "뉴스 컨텐츠 언론사",
        "nc_dtime": "2016-08-23 13:22:33",
        "favorite_cnt" : 1,
        "favorite": false
      },
      {
        "id" : 9,
        "title" : "스크랩 제목",
        "nc_title": "단말기 지원금 상한제, '일몰' 앞당겨야",
        "nc_img_url" : "http://.../images/newscontents/20160821.bmp",
        "nc_author": "뉴스 컨텐츠 언론사",
        "nc_dtime": "2016-08-23 13:22:33",
        "favorite_cnt" : 1,
        "favorite": true
      },
      {
        "id" : 10,
        "title" : "스크랩 제목",
        "nc_title": "니콘, 신제품 DSLR 'D3400' 내달 출시",
        "nc_img_url" : "http://.../images/newscontents/20160821.bmp",
        "nc_author": "뉴스 컨텐츠 언론사",
        "nc_dtime": "2016-08-23 13:22:33",
        "favorite_cnt" : 1,
        "favorite": true
      }
    ]
  });
};