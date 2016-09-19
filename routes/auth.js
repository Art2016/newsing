var express = require('express');
var router = express.Router();
var passport = require('passport');
var FacebookTokenStrategy = require('passport-facebook-token');
var User = require('../models/user');
var isSecure = require('./common').isSecure;
var logger = require('../common/logger');

// 페이스북 전략
passport.use(new FacebookTokenStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET
  }, function(accessToken, refreshToken, profile, done) {
    User.findOrCreate(profile, function (err, user) {
      if (err) {
        return done(err);
      }
      return done(null, user);
    });
  }
));
/* ----------------------------------------------------------------------- */
passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findByNameAndProfileUrlAndNotifications(id, function(err, user) {
    if (err) {
      return done(err);
    }
    done(null, user);
  });
});
/* ----------------------------------------------------------------------- */
router.post('/auth/facebook/token', isSecure, passport.authenticate('facebook-token'), function(req, res, next) {
  logger.log('debug', 'content-type: %s', req.headers['content-type']);
  logger.log('debug', '%s %s://%s%s', req.method, req.protocol, req.headers['host'], req.originalUrl);
  logger.log('debug', 'query: %j', req.query, {});
  logger.log('debug', 'registration_token: %s', req.body.registration_token);

  if (!req.user) res.send({ error: "로그인에 실패하였습니다." });

  // fcm 토큰 값 업데이트
  User.updateToken(req.body.registration_token, req.user.id, function(err) {
    if (err) return next();
    res.send({ result: req.user });
  });
});

router.get('/logout', function(req, res, next) {
  logger.log('debug', 'content-type: %s', req.headers['content-type']);
  logger.log('debug', '%s %s://%s%s', req.method, req.protocol, req.headers['host'], req.originalUrl);
  logger.log('debug', 'query: %j', req.query, {});

  req.logout();
  res.send({ result: "로그아웃하였습니다." });
});

router.get('/', function(req, res, next) {
  res.send({ result: "로그인" });
});

module.exports = router;
