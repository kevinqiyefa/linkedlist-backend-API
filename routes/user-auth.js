const db = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const APIError = require('../APIError');

async function userAuth(req, res, next) {
  try {
    const foundUser = await db.query('SELECT * FROM users WHERE username=$1', [
      req.body.username
    ]);

    if (!foundUser.rowCount) {
      return next(new APIError(404, 'Not Found', 'No user found'));
    }

    const result = await bcrypt.compare(
      req.body.password,
      foundUser.rows[0].password
    );

    if (!result) {
      return next(
        new APIError(
          401,
          'Unauthorized',
          'You need to authenticate before accessing this resource.'
        )
      );
    } else {
      const token = jwt.sign(
        {
          username: foundUser.rows[0].username
        },
        'SECRET'
      );

      return res.json({ token });
    }
  } catch (err) {
    return next(err);
  }
}

module.exports = userAuth;
