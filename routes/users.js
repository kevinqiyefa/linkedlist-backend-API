const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { ensureloggedin, ensureCorrectUser } = require('../middleware/auth');
const { validate } = require('jsonschema');
const userSchema = require('../jsonSchema/users');
const APIError = require('../APIError');

router.get('', ensureloggedin, async function(req, res, next) {
  try {
    const offset = req.query.offset ? req.query.offset : 0;
    const limit =
      req.query.limit && req.query.limit < 50 ? req.query.limit : 50;

    const search = req.query.search ? req.query.search + '%' : req.query.search;
    let data;
    //console.log(search);
    if (!search) {
      data = await db.query('SELECT * FROM users LIMIT $1 OFFSET $2', [
        limit,
        offset
      ]);
    } else {
      data = await db.query(
        'SELECT * FROM users WHERE username ILIKE $1 LIMIT $2 OFFSET $3',
        [search, limit, offset]
      );
    }

    for (let user of data.rows) {
      const jobsdata = await db.query(
        'SELECT job_id FROM jobs_users where user_id=$1',
        [user.id]
      );
      user.applied_to = jobsdata.rows.map(x => x.job_id);
      delete user.password;
    }
    return res.json(data.rows);
  } catch (err) {
    return next(err);
  }
});

router.post('', async function(req, res, next) {
  try {
    const result = validate(req.body, userSchema);
    if (!result.valid) {
      // pass the validation errors to the error handler
      return next(
        new APIError(
          400,
          'Bad Request',
          result.errors.map(e => e.stack).join('. ')
        )
      );
    }

    const username = await db.query('SELECT * FROM users WHERE username=$1', [
      req.body.username
    ]);

    if (username.rowCount) {
      return next(
        new APIError(409, 'Conflict', 'User with that username exists already.')
      );
    }

    const hashPassword = await bcrypt.hash(req.body.password, 10);
    const newUser = await db.query(
      'INSERT INTO users (first_name, last_name, email, photo, current_company, username, password) VALUES($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [
        req.body.first_name,
        req.body.last_name,
        req.body.email,
        req.body.photo,
        req.body.current_company,
        req.body.username,
        hashPassword
      ]
    );
    delete newUser.rows[0].password;
    return res.json(newUser.rows[0]);
  } catch (err) {
    return next(err);
  }
});

router.get('/:username', ensureloggedin, async function(req, res, next) {
  try {
    const userdata = await db.query('SELECT * FROM users WHERE username=$1', [
      req.params.username
    ]);

    const jobsdata = await db.query(
      'SELECT job_id FROM jobs_users where user_id=$1',
      [userdata.rows[0].id]
    );
    userdata.rows[0].applied_to = jobsdata.rows.map(x => x.job_id);
    delete userdata.rows[0].password;
    return res.json(userdata.rows[0]);
  } catch (err) {
    return next(err);
  }
});

router.patch('/:username', ensureCorrectUser, async function(req, res, next) {
  try {
    const result = validate(req.body, userSchema);
    if (!result.valid) {
      // pass the validation errors to the error handler
      // use new APIError (status, text, message)
      // will get an array

      return next(
        new APIError(
          400,
          'Bad Request',
          result.errors.map(e => e.stack).join('. ')
        )
      );
    }
    const hashPassword = await bcrypt.hash(req.body.password, 10);

    const data = await db.query(
      'UPDATE users SET first_name=$1, last_name=$2, email=$3, photo=$4, current_company=$5, username=$6, password=$7 WHERE username=$8 RETURNING *',
      [
        req.body.first_name,
        req.body.last_name,
        req.body.email,
        req.body.photo,
        req.body.current_company,
        req.params.username,
        hashPassword,
        req.params.username
      ]
    );
    delete data.rows[0].password;
    return res.json(data.rows[0]);
  } catch (err) {
    return next(err);
  }
});

router.delete('/:username', ensureCorrectUser, async function(req, res, next) {
  try {
    const data = await db.query('DELETE FROM users WHERE username=$1', [
      req.params.username
    ]);
    return res.json({ message: 'Deleted user!' });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
