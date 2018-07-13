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
const APIError = require('../APIError');

router.get('', ensureloggedin, async function(req, res, next) {
  try {
    const offset = req.query.offset ? req.query.offset : 0;
    const limit =
      req.query.limit && req.query.limit < 50 ? req.query.limit : 50;

    const search = req.query.search ? req.query.search + '%' : req.query.search;
    let data;

    if (!search) {
      data = await db.query('SELECT * FROM jobs LIMIT $1 OFFSET $2', [
        limit,
        offset
      ]);
    } else {
      data = await db.query(
        'SELECT * FROM jobs WHERE handle ILIKE $1 LIMIT $2 OFFSET $3',
        [search, limit, offset]
      );
    }
    // const data = await db.query('SELECT * FROM jobs');
    // console.log(data);
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
      return next(
        new APIError(
          400,
          'Bad Request',
          result.errors.map(e => e.stack).join('. ')
        )
      );
    }

    const data = await db.query(
      'INSERT INTO jobs (title, salary, equity, company) VALUES($1, $2, $3, $4) RETURNING *',
      [req.body.title, req.body.salary, req.body.equity, req.handle]
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

// job/:id
router.patch('/:id', ensureLoginCompany, async function(req, res, next) {
  try {
    // SELECT * FROM jobs WHERE id = $1;
    const job = await db.query('SELECT * FROM jobs WHERE id=$1', [
      req.params.id
    ]);
    // compare req.company_handle with job.company

    const result = validate(req.body, jobSchema);
    if (job.rows[0].company !== req.handle) {
      return next(
        new APIError(
          401,
          'Unauthorized',
          result.errors.map(e => e.stack).join('. ')
        )
      );
    }
    //  if its not the same company handle, next(err)
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
    // console.log('HANDLE', req.handle);
    const data = await db.query(
      'UPDATE jobs SET title=$1, salary=$2, equity=$3, company=$4 WHERE id=$5 RETURNING *',
      [
        req.body.title,
        req.body.salary,
        req.body.equity,
        req.handle,
        req.params.id
      ]
    );
    return res.json(data.rows[0]);
  } catch (err) {
    return next(err);
  }
});

router.delete('/:id', ensureLoginCompany, async function(req, res, next) {
  try {
    const job = await db.query('SELECT * FROM jobs WHERE id=$1', [
      req.params.id
    ]);
    // compare req.company_handle with job.company

    //const result = validate(req.body, jobSchema);
    if (job.rows[0].company !== req.handle) {
      return next(
        new APIError(401, 'Unauthorized', 'Cannot delete other jobs')
      );
    }

    const data = await db.query('DELETE FROM jobs WHERE id=$1', [
      req.params.id
    ]);
    return res.json({ message: 'Deleted!' });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
