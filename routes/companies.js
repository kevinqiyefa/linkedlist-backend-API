const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { ensureloggedin, ensureCorrectCompany } = require('../middleware/auth');
const { validate } = require('jsonschema');
const companySchema = require('../jsonSchema/companies');

router.get('', ensureloggedin, async function(req, res, next) {
  try {
    const data = await db.query('SELECT * FROM companies');
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
      return next(result.errors.map(e => e.stack));
    }
    const hashPassword = await bcrypt.hash(req.body.password, 10);
    const data = await db.query(
      'INSERT INTO companies (name, logo, handle, password) VALUES($1, $2, $3, $4) RETURNING *',
      [req.body.name, req.body.logo, req.body.handle, hashPassword]
    );
    delete data.rows[0].password;
    return res.json(data.rows[0]);
  } catch (err) {
    return next(err);
  }
});

router.get('/:id', ensureloggedin, async function(req, res, next) {
  try {
    const companiesData = await db.query(
      'SELECT * FROM companies WHERE id=$1',
      [req.params.id]
    );

    const usersData = await db.query(
      'SELECT * FROM users WHERE current_company_id=$1',
      [req.params.id]
    );

    let usersID = usersData.rows.map(x => x.id);

    companiesData.rows[0].users = usersID;

    const jobsData = await db.query('SELECT * FROM jobs WHERE company_id=$1', [
      req.params.id
    ]);

    let jobsID = jobsData.rows.map(x => x.id);
    companiesData.rows[0].jobs = jobsID;

    return res.json(companiesData.rows[0]);
  } catch (err) {
    return next(err);
  }
});

router.patch('/:id', ensureCorrectCompany, async function(req, res, next) {
  try {
    const result = validate(req.body, companySchema);
    if (!result.valid) {
      // pass the validation errors to the error handler
      return next(result.errors.map(e => e.stack));
    }
    const hashPassword = await bcrypt.hash(req.body.password, 10);
    const data = await db.query(
      'UPDATE companies SET name=$1, logo=$2, handle=$3, password=$4 WHERE id=$5 RETURNING *',
      [
        req.body.name,
        req.body.logo,
        req.body.handle,
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

router.delete('/:id', ensureCorrectCompany, async function(req, res, next) {
  try {
    const data = await db.query('DELETE FROM companies WHERE id=$1', [
      req.params.id
    ]);
    return res.json({ message: 'Deleted!' });
  } catch (err) {
    return next(err);
  }
});

router.post('/auth', async (req, res, next) => {
  try {
    const foundCompany = await db.query(
      'SELECT * FROM companies WHERE handle=$1',
      [req.body.handle]
    );

    if (foundCompany.rows.length === 0) {
      return res.json({ message: 'Invalid Credentials!' });
    }

    const result = await bcrypt.compare(
      req.body.password,
      foundCompany.rows[0].password
    );

    if (!result) {
      return res.json({ message: 'Invalid Credentials!' });
    } else {
      const token = jwt.sign(
        {
          company_id: foundCompany.rows[0].id
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
