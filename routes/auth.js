var express = require('express');
var router = express.Router();
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var FacebookTokenStrategy = require('passport-facebook-token');
var User = require('../models/user');

passport.use(new LocalStrategy({usernameField: 'email', passwordField: 'password'}, function(email, password, done) {
  var user = {
    email: email,
    password: password
  };
  done(null, user);
}));

// 페이스북 전략
passport.use(new FacebookTokenStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET
  }, function(accessToken, refreshToken, profile, done) {
    // user 모델에서 findOrCreate
    console.log(profile);
    User.findOrCreate(profile, function (err, id) {
      if (err) {
        console.log(err);
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
router.post('/auth/local/login', function(req, res, next) {
  passport.authenticate('local', function(err, user) {
    if (err) {
      return next(err);
    }
    if (!user) {
      return res.status(401).send({
        message: 'Login failed!!!'
      });
    }
    req.login(user, function(err) {
      if (err) {
        return next(err);
      }
      next();
    });
  })(req, res, next);
}, function(req, res, next) {
  var user = {};
  user.email = req.user.email;
  user.name = req.user.name;
  res.send({
    message: 'local login',
    user: user
  });
});

router.post('/auth/facebook/token', passport.authenticate('facebook-token'), function(req, res, next) {
  if (req.user) {
    User.findByNameAndProfileUrl(req.user, function(err, user) {
      if (err) {
        return next(err);
      }
      res.send({ result: user })
    });
  } else {
    res.send({
      error: "로그인에 실패하셨습니다."
    });
  }
});

router.get('/logout', function(req, res, next) {
  req.logout();
  res.send({ result: "로그아웃하였습니다." });
});

module.exports = router;
