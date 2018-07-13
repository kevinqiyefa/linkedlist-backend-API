const db = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const APIError = require('../APIError');

async function companyAuth(req, res, next) {
  try {
    const foundCompany = await db.query(
      'SELECT * FROM companies WHERE handle=$1',
      [req.body.handle]
    );

    if (foundCompany.rows.length === 0) {
      return next(new APIError(404, 'Not Found', 'No handle found'));
    }

    const result = await bcrypt.compare(
      req.body.password,
      foundCompany.rows[0].password
    );

    if (!result) {
      return next(
        new APIError(401, 'Unauthorized', 'double check pw/username.')
      );
    } else {
      const token = jwt.sign(
        {
          handle: foundCompany.rows[0].handle
        },
        'SECRET'
      );

      return res.json({ token });
    }
  } catch (err) {
    return next(err);
  }
}

module.exports = companyAuth;
