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

var auth = require('./routes/auth');
var user = require('./routes/user');
var newscontents = require('./routes/newscontents');

var app = express();


// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(session({
  secret: process.env.SESSION_SECRET,
  store: new RedisStore({
    host: '127.0.0.1',
    port: 6379,
    client: redisClient
  }),
  resave: true, // 세션의 변경이 없으면 저장하지 말 것
  saveUninitialized: false // 저장되는 것이 없으면 세션을 만들지 말 것
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(path.join(__dirname, 'public')));
// TODO: 이미지 디렉토리 구조 정의 필요
//app.use('/images', express.static(path.join(__dirname, 'upload/images')));

app.use('/', auth);
app.use('/user', user);
app.use('/newscontents', newscontents);

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
