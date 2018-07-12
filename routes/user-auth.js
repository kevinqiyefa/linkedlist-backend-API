const db = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

async function userAuth(req, res, next) {
  try {
    const foundUser = await db.query('SELECT * FROM users WHERE username=$1', [
      req.body.username
    ]);

    if (foundUser.rows.length === 0) {
      return res.json({ message: 'Invalid Credentials!' });
    }

    const result = await bcrypt.compare(
      req.body.password,
      foundUser.rows[0].password
    );

    if (!result) {
      return res.json({ message: 'Invalid Credentials!' });
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
