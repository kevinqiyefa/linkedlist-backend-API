const express = require('express');
// need mergeParams because of how our route is written /jobs/:id/applications
const router = express.Router({ mergeParams: true });
const db = require('../db');
const jwt = require('jsonwebtoken');
const {
  ensureloggedin,
  ensureCorrectCompany,
  ensureLoginCompany,
  ensureCorrectUser,
  ensureLoginUser
} = require('../middleware/auth');
const { validate } = require('jsonschema');
const jobSchema = require('../jsonSchema/jobs');
const APIError = require('../APIError');

router.get('', ensureloggedin, async function(req, res, next) {
  try {
    const jobExists = await db.query('SELECT * FROM jobs WHERE id=$1', [
      req.params.job_id
    ]);

    if (!jobExists.rowCount) {
      return next(new APIError(404, 'Not FOUND', 'Job does not exists!'));
    }
    const jobApp = await db.query(
      'SELECT * FROM applications WHERE job_id=$1',
      [req.params.job_id]
    );
    return res.json(jobApp.rows);
  } catch (err) {
    return next(err);
  }
});

router.get('/:id', ensureloggedin, async function(req, res, next) {
  try {
    const jobApp = await db.query(
      'SELECT * FROM applications WHERE job_id=$1 AND id=$2',
      [req.params.job_id, req.params.id]
    );

    if (!jobApp.rowCount) {
      return next(new APIError(404, 'Not FOUND', 'Job does not exists!'));
    }

    return res.json(jobApp.rows);
  } catch (err) {
    return next(err);
  }
});

router.post('', ensureLoginUser, async function(req, res, next) {
  try {
    const jobExists = await db.query('SELECT * FROM jobs WHERE id=$1', [
      req.params.job_id
    ]);

    if (!jobExists.rowCount) {
      return next(new APIError(404, 'Not FOUND', 'Job does not exists!'));
    }

    const jobApp = await db.query(
      'INSERT INTO applications (username, job_id) VALUES($1, $2) RETURNING *',
      [req.username, req.params.job_id]
    );
    return res.json(jobApp.rows[0]);
  } catch (err) {
    return next(err);
  }
});

router.delete('/:id', ensureLoginUser, async function(req, res, next) {
  try {
    const ensureUser = await db.query(
      'SELECT * FROM applications WHERE id=$1 AND username=$2',
      [req.params.id, req.username]
    );
    if (!ensureUser.rowCount) {
      return next(
        new APIError(
          401,
          'Unauthorized',
          'You cannot delete others application.'
        )
      );
    }

    const jobApp = await db.query(
      'SELECT * FROM applications WHERE job_id=$1 AND id=$2',
      [req.params.job_id, req.params.id]
    );

    if (!jobApp.rowCount) {
      return next(new APIError(404, 'Not FOUND', 'Job does not exists!'));
    }

    return res.json({ message: 'Deleted job application!!!' });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
