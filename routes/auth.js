var express = require('express');
var router = express.Router();
var passport = require('passport');
var FacebookTokenStrategy = require('passport-facebook-token');
var User = require('../models/user');

// 페이스북 전략
passport.use(new FacebookTokenStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    profileFields: ['id', 'displayName','profileUrl']
  }, function(accessToken, refreshToken, profile, done) {
    console.log(profile);
    // user 모델에서 findOrCreate
    User.findOrCreate(profile, function (err, id) {
      if (err) {
        return done(err);
      }
      return done(null, id);
    });
  }
));
/* ----------------------------------------------------------------------- */
passport.serializeUser(function(id, done) {
  done(null, id);
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
router.post('/auth/facebook/token', passport.authenticate('facebook-token'), function(req, res) {
  if (req.user) {
    res.send({
      result: {
        name: req.user.name,
        pf_url: req.user.pf_url
      }
    })
  } else {
    res.send({
      error: "로그인에 실패하셨습니다."
    });
  }
});

router.get('/logout', function(req, res, next) {
  req.logout();
  res.send({ result: '로그아웃하였습니다.' });
});

module.exports = router;
