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

    if (decodedToken.user_id === +req.params.id) {
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

function ensureLoginCompany(req, res, next) {
  try {
    const token = req.headers.authorization;
    const decodedToken = jwt.verify(token, 'SECRET');

    if (decodedToken.company_id) {
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

function ensureCorrectCompany(req, res, next) {
  try {
    const token = req.headers.authorization;
    const decodedToken = jwt.verify(token, 'SECRET');

    if (decodedToken.company_id === +req.params.id) {
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
module.exports = {
  ensureloggedin,
  ensureCorrectUser,
  ensureCorrectCompany,
  ensureLoginCompany
};
