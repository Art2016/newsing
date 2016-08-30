var express = require('express');
var router = express.Router();
var passport = require('passport');
var FacebookTokenStrategy = require('passport-facebook-token');
var User = require('../models/user');
var isSecure = require('./common').isSecure;

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
  User.findByNameAndProfileUrl(id, function(err, user) {
    if (err) {
      return done(err);
    }
    done(null, user);
  });
});
/* ----------------------------------------------------------------------- */
router.post('/auth/facebook/token', isSecure, passport.authenticate('facebook-token'), function(req, res, next) {
    res.send(req.user ? { result: req.user } : { error: "로그인에 실패하였습니다." });
});

router.get('/logout', function(req, res, next) {
  req.logout();
  res.send({ result: "로그아웃하였습니다." });
});

module.exports = router;