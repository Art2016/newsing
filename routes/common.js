function isAuthenticated(req, res, next) {
  if (!req.user && !req.url.match(/\/auth.*/i)) { // 로그인을 반드시 하도록 설정
    return res.status(401).send({
      message: 'login required'
    });
  }
  next();
}

function isSecure(req, res, next) {
  if (!req.secure) {
    return res.status(426).send({
      message: 'upgrade required'
    });
  }
  next();
}

module.exports.isAuthenticated = isAuthenticated;
module.exports.isSecure = isSecure;