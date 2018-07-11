const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('', async function(req, res, next) {
  try {
    const data = await db.query('SELECT * FROM jobs_users');
    return res.json(data.rows);
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
