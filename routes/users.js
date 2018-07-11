const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { ensureloggedin, ensureCorrectUser } = require('../middleware/auth');
const { validate } = require('jsonschema');
const userSchema = require('../jsonSchema/users');

router.get('', ensureloggedin, async function(req, res, next) {
  try {
    const data = await db.query('SELECT * FROM users');
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
      return next(result.errors.map(e => e.stack));
    }
    const hashPassword = await bcrypt.hash(req.body.password, 10);
    const newUser = await db.query(
      'INSERT INTO users (first_name, last_name, email, photo, current_company_id, username, password) VALUES($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [
        req.body.first_name,
        req.body.last_name,
        req.body.email,
        req.body.photo,
        req.body.current_company_id,
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

router.get('/:id', ensureloggedin, async function(req, res, next) {
  try {
    const userdata = await db.query('SELECT * FROM users WHERE id=$1', [
      req.params.id
    ]);

    const jobsdata = await db.query(
      'SELECT job_id FROM jobs_users where user_id=$1',
      [req.params.id]
    );
    userdata.rows[0].jobs = jobsdata.rows.map(x => x.job_id);
    return res.json(userdata.rows[0]);
  } catch (err) {
    return next(err);
  }
});

router.patch('/:id', ensureCorrectUser, async function(req, res, next) {
  try {
    const result = validate(req.body, userSchema);
    if (!result.valid) {
      // pass the validation errors to the error handler
      return next(result.errors.map(e => e.stack));
    }
    const hashPassword = await bcrypt.hash(req.body.password, 10);
    console.log(hashPassword);
    const data = await db.query(
      'UPDATE users SET first_name=$1, last_name=$2, email=$3, photo=$4, current_company_id=$5, username=$6, password=$7 WHERE id=$8 RETURNING *',
      [
        req.body.first_name,
        req.body.last_name,
        req.body.email,
        req.body.photo,
        req.body.current_company_id,
        req.body.username,
        hashPassword,
        req.params.id
      ]
    );
    delete data.rows[0].password;
    return res.json(data.rows[0]);
  } catch (err) {
    return next(err);
  }
});

router.delete('/:id', ensureCorrectUser, async function(req, res, next) {
  try {
    const data = await db.query('DELETE FROM users WHERE id=$1', [
      req.params.id
    ]);
    return res.json({ message: 'Deleted!' });
  } catch (err) {
    return next(err);
  }
});

router.post('/auth', async (req, res, next) => {
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
          user_id: foundUser.rows[0].id
        },
        'SECRET'
      );

      return res.json({ token });
    }
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
