const express = require('express');
const router = express.Router();
const db = require('../db');
const jwt = require('jsonwebtoken');
const {
  ensureloggedin,
  ensureCorrectCompany,
  ensureLoginCompany
} = require('../middleware/auth');
const { validate } = require('jsonschema');
const jobSchema = require('../jsonSchema/jobs');

router.get('', ensureloggedin, async function(req, res, next) {
  try {
    const data = await db.query('SELECT * FROM jobs');
    return res.json(data.rows);
  } catch (err) {
    return next(err);
  }
});

router.post('', ensureLoginCompany, async function(req, res, next) {
  try {
    const result = validate(req.body, jobSchema);
    if (!result.valid) {
      // pass the validation errors to the error handler
      return next(result.errors.map(e => e.stack));
    }
    const token = req.headers.authorization;
    const decodedToken = jwt.verify(token, 'SECRET');
    const companyid = decodedToken.company_id;
    const data = await db.query(
      'INSERT INTO jobs (title, salary, equity, company_id) VALUES($1, $2, $3, $4) RETURNING *',
      [req.body.title, req.body.salary, req.body.equity, companyid]
    );
    return res.json(data.rows[0]);
  } catch (err) {
    return next(err);
  }
});

router.get('/:id', ensureloggedin, async function(req, res, next) {
  try {
    const data = await db.query('SELECT * FROM jobs where id=$1', [
      req.params.id
    ]);
    return res.json(data.rows[0]);
  } catch (err) {
    return next(err);
  }
});

router.patch('/:id', ensureCorrectCompany, async function(req, res, next) {
  try {
    const result = validate(req.body, jobSchema);
    if (!result.valid) {
      // pass the validation errors to the error handler
      return next(result.errors.map(e => e.stack));
    }
    const token = req.headers.authorization;
    const decodedToken = jwt.verify(token, 'SECRET');
    const companyid = decodedToken.company_id;

    const data = await db.query(
      'UPDATE jobs SET title=$1, salary=$2, equity=$3, company_id=$4 WHERE id=$5 RETURNING *',
      [
        req.body.title,
        req.body.salary,
        req.body.equity,
        companyid,
        req.params.id
      ]
    );
    return res.json(data.rows[0]);
  } catch (err) {
    return next(err);
  }
});

router.delete('/:id', ensureCorrectCompany, async function(req, res, next) {
  try {
    const data = await db.query('DELETE FROM jobs WHERE id=$1', [
      req.params.id
    ]);
    return res.json({ message: 'Deleted!' });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
