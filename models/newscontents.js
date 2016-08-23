module.exports.listNewscontents = function(callback) {
  var newscontents = {};
  newscontents["results"] = [];
  for (var i = 0; i< 10; i++) {
    newscontents["results"].push({
      "keyword": "keyword" + parseInt(i + 1),
      "newscontens": [
        {
          "id": 1,
          "title": "제목1",
          "contents": "해외송금 수수료를 은행 대비 5분의1 수준으로 낮추고, 송금이 완료되는 시간도 1시간 이내로 줄인 블록체인 기반 해외송금 플랫폼이 국내서 서비스를 시작했다.",
          "img_url": "http://…/images/newscontents/20160821_id.bmp",
          "ntime": "2016-08-22 09:33:25",
          "author": "언론사"
        },
        {
          "id": 2,
          "title": "제목2",
          "contents": "단말기 유통구조 개선법(이하 단통법) 시행 2년을 앞두고 법 개정을 요구하는 목소리가 높아지고 있다. ‘지원금 상한제 폐지’부터 ‘분리공시’, ‘완전자급제’, ‘지원금에 상응하는 요금할인율 상향조정’, ‘번호이동시 추가지원금 허용’ 등 단통법 시행 과정에서 돌출됐던 이슈들이 봇물처럼 제기되고 있다.",
          "img_url": "http://…/images/newscontents/20160821_id.bmp",
          "ntime": "2016-08-22 09:33:25",
          "author": "언론사"
        },
        {
          "id": 3,
          "title": "제목3",
          "contents": "중앙 및 지방자치단체 정책입안자의 접근 방식에 근본적인 전환이 필요하다는 지적이다. 한국에서 지역 행정과 공공사업에 IT를 도입, 활용하는 익숙한 접근 방식은 전형적인 하향식(top-down) 일처리로 요약할 수 있다.",
          "img_url": "http://…/images/newscontents/20160821_id.bmp",
          "ntime": "2016-08-22 09:33:25",
          "author": "언론사"
        }
      ]
    });
  }
  callback(null, newscontents);
};

module.exports.findeNewscontents = function(id, callback) {
  callback(null, {
    "result": {
      "title": "제목" + id,
      "contents": "해외송금 수수료를 은행 대비 5분의1 수준으로 낮추고, 송금이 완료되는 시간도 1시간 이내로 줄인 블록체인 기반 해외송금 플랫폼이 국내서 서비스를 시작했다.",
      "img_url": "http://…/images/newscontents/20160821_id.bmp",
      "link": "http://news.joins.com/article/20494115",
      "ntime": "2016-08-22 09:33:25",
      "author": "언론사"
    }
  });
};