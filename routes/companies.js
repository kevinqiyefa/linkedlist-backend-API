const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { ensureloggedin, ensureCorrectCompany } = require('../middleware/auth');
const { validate } = require('jsonschema');
const companySchema = require('../jsonSchema/companies');
const APIError = require('../APIError');

router.get('', ensureloggedin, async function(req, res, next) {
  try {
    // const data = await db.query('SELECT * FROM companies');
    // return res.json(data.rows);
    const offset = req.query.offset ? req.query.offset : 0;
    const limit =
      req.query.limit && req.query.limit < 50 ? req.query.limit : 50;

    const search = req.query.search ? req.query.search + '%' : req.query.search;
    let data;

    if (!search) {
      data = await db.query('SELECT * FROM companies LIMIT $1 OFFSET $2', [
        limit,
        offset
      ]);
    } else {
      data = await db.query(
        'SELECT * FROM companies WHERE handle ILIKE $1 LIMIT $2 OFFSET $3',
        [search, limit, offset]
      );
    }

    for (let company of data.rows) {
      const employeeData = await db.query(
        'SELECT * FROM users WHERE current_company=$1',
        [company.handle]
      );

      let employeesName = employeeData.rows.map(x => x.username);

      company.employees = employeesName;

      const jobsData = await db.query('SELECT * FROM jobs WHERE company=$1', [
        company.id
      ]);
      let jobsID = jobsData.rows.map(job => job.id);
      company.jobs = jobsID;
      delete company.password;
    }
    return res.json(data.rows);
  } catch (err) {
    return next(err);
  }
});

router.post('', async function(req, res, next) {
  try {
    const result = validate(req.body, companySchema);
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
    const hashPassword = await bcrypt.hash(req.body.password, 10);
    const data = await db.query(
      'INSERT INTO companies (name, logo, handle, password, email) VALUES($1, $2, $3, $4, $5) RETURNING *',
      [
        req.body.name,
        req.body.logo,
        req.body.handle,
        hashPassword,
        req.body.email
      ]
    );
    delete data.rows[0].password;
    return res.json(data.rows[0]);
  } catch (err) {
    return next(err);
  }
});

router.get('/:handle', ensureloggedin, async function(req, res, next) {
  try {
    const companiesData = await db.query(
      'SELECT * FROM companies WHERE handle=$1',
      [req.params.handle]
    );

    const employeeData = await db.query(
      'SELECT * FROM users WHERE current_company=$1',
      [req.params.handle]
    );

    let employeesName = employeeData.rows.map(x => x.username);

    companiesData.rows[0].users = employeesName;

    const jobsData = await db.query('SELECT * FROM jobs WHERE company=$1', [
      companiesData.id
    ]);

    let jobsID = jobsData.rows.map(x => x.id);
    companiesData.rows[0].jobs = jobsID;

    return res.json(companiesData.rows[0]);
  } catch (err) {
    return next(err);
  }
});

router.patch('/:handle', ensureCorrectCompany, async function(req, res, next) {
  try {
    const result = validate(req.body, companySchema);
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
    const hashPassword = await bcrypt.hash(req.body.password, 10);
    const data = await db.query(
      'UPDATE companies SET name=$1, logo=$2, handle=$3, password=$4 , email=$5 WHERE handle=$6 RETURNING *',
      [
        req.body.name,
        req.body.logo,
        req.params.handle,
        hashPassword,
        req.body.email,
        req.params.handle
      ]
    );
    delete data.rows[0].password;
    return res.json(data.rows[0]);
  } catch (err) {
    return next(err);
  }
});

router.delete('/:handle', ensureCorrectCompany, async function(req, res, next) {
  try {
    const data = await db.query('DELETE FROM companies WHERE handle=$1', [
      req.params.handle
    ]);
    return res.json({ message: 'Deleted company!' });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
