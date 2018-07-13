const jwt = require('jsonwebtoken');
function ensureloggedin(req, res, next) {
  try {
    const token = req.headers.authorization;
    const decodedToken = jwt.verify(token, 'SECRET');

    return next();
  } catch (err) {
    return res.json({
      message: 'Unauthorized'
    });
  }
}

function ensureCorrectUser(req, res, next) {
  try {
    const token = req.headers.authorization;
    const decodedToken = jwt.verify(token, 'SECRET');

    if (decodedToken.username === req.params.username) {
      return next();
    } else {
      return res.json({
        message: 'Unauthorized'
      });
    }
  } catch (err) {
    return res.json({
      message: 'Unauthorized'
    });
  }
}

function ensureLoginUser(req, res, next) {
  try {
    const token = req.headers.authorization;
    const decodedToken = jwt.verify(token, 'SECRET');

    // embed the company handle here
    if (decodedToken.username) {
      req.username = decodedToken.username;
      return next();
    } else {
      return res.json({
        status: 401,
        message: 'Unauthorized token'
      });
    }
  } catch (err) {
    return res.json({
      message: 'Unauthorized'
    });
  }
}

function ensureLoginCompany(req, res, next) {
  try {
    const token = req.headers.authorization;
    const decodedToken = jwt.verify(token, 'SECRET');

    // embed the company handle here
    if (decodedToken.handle) {
      req.handle = decodedToken.handle;
      return next();
    } else {
      return res.json({
        status: 401,
        message: 'Unauthorized token'
      });
    }
  } catch (err) {
    return res.json({
      message: 'ERROR'
    });
  }
}

function ensureCorrectCompany(req, res, next) {
  try {
    const token = req.headers.authorization;
    const decodedToken = jwt.verify(token, 'SECRET');
    if (decodedToken.handle === req.params.handle) {
      return next();
    } else {
      return res.json({
        status: 401,
        message: 'Unauthorized TOKEN'
      });
    }
  } catch (err) {
    return res.json({
      message: 'ERROR'
    });
  }
}
module.exports = {
  ensureloggedin,
  ensureCorrectUser,
  ensureCorrectCompany,
  ensureLoginCompany,
  ensureLoginUser
};
