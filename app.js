var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var passport = require('passport');
var redis = require('redis');
var redisClient = redis.createClient();
var RedisStore = require('connect-redis')(session);

var auth = require('./routes/auth'); // 로그인
var user = require('./routes/user'); // 사용자
var newscontents = require('./routes/newscontents'); // 뉴스 컨텐츠
var scrap = require('./routes/scrap'); // 스크랩
var search = require('./routes/search'); // 검색
var keyword = require('./routes/keyword'); // 키워드
var follow = require('./routes/follow'); // 팔로우
var notification = require('./routes/notification'); // 알림

var app = express();

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(session({
  secret: process.env.SESSION_SECRET,
  store: new RedisStore({ // redis에 저장
    host: '127.0.0.1',
    port: 6379,
    client: redisClient
  }),
  resave: true, // 세션의 변경이 없으면 저장하지 말 것
  saveUninitialized: false // 저장되는 것이 없으면 세션을 만들지 말 것
}));
app.use(passport.initialize());
app.use(passport.session());
// 로그인해야 서비스 사용가능하도록 설정
app.use(require('./routes/common').isAuthenticated);
app.use(express.static(path.join(__dirname, 'public')));
// 이미지 디렉토리
app.use('/images', express.static(path.join(__dirname, 'uploads/images')));

app.use('/', auth); // 로그인
app.use('/users', user); // 사용자
app.use('/newscontents', newscontents); // 뉴스 컨텐츠
app.use('/scraps', scrap); // 스크랩
app.use('/search', search); // 검색
app.use('/keywords', keyword); // 키워드
app.use('/follows', follow); // 팔로우
app.use('/notifications', notification); // 알림

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.send({
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.send({
    message: err.message,
    error: {}
  });
});

module.exports = app;
