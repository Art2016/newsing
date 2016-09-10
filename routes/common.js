var gcm = require('node-gcm');
var logger = require('../common/logger');

function isAuthenticated(req, res, next) {
  if (!req.user && !req.url.match(/\/auth.*/i)) { // 로그인을 반드시 하도록 설정
    logger.log('debug', 'content-type: %s', req.headers['content-type']);
    logger.log('debug', '%s %s://%s%s', req.method, req.protocol, req.headers['host'], req.originalUrl);
    logger.log('debug', 'query: %j', req.query, {});

    return res.status(401).send({
      message: 'login required'
    });
  }
  next();
}

function isSecure(req, res, next) {
  if (!req.secure) {
    logger.log('debug', 'content-type: %s', req.headers['content-type']);
    logger.log('debug', '%s %s://%s%s', req.method, req.protocol, req.headers['host'], req.originalUrl);
    logger.log('debug', 'query: %j', req.query, {});

    return res.status(426).send({
      message: 'upgrade required'
    });
  }
  next();
}

function sendMessage(messageObj, tokens, callback) {
  /* Create a message
  {
    collapseKey: '1',
    delayWhileIdle: true,
    timeToLive: 3,
    /!*
     data: {
     key1: 'message1',
     key2: 'message2'
     },
     *!/
    notification: {
      title: title,
      body: body
    }
  }
  */
  var message = new gcm.Message(messageObj);
  // Set up the sender with you API key
  var sender = new gcm.Sender(process.env.FCM_API_KEY);

  // Send the message retrying
  sender.send(message, { registrationTokens: tokens }, function (err, response) {
    if(err) callback(err);
    else callback(null, response);
  });
}

module.exports.isAuthenticated = isAuthenticated;
module.exports.isSecure = isSecure;
module.exports.sendMessage = sendMessage;
