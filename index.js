const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const morgan = require('morgan');
const userRoutes = require('./routes/users');
const companyRoutes = require('./routes/companies');
const jobRoutes = require('./routes/jobs');
const userJobRoutes = require('./routes/jobs_users');
const cors = require('cors');

app.use(cors());
app.use(bodyParser.json());
app.use(morgan('dev'));
app.use('/users', userRoutes);
app.use('/companies', companyRoutes);
app.use('/jobs', jobRoutes);
app.use('/jobs_users', userJobRoutes);

// catch 404 and forward to error handler
app.use((req, res, next) => {
  const err = new Error('Not Found');
  err.status = 404;
  return next(err); // pass the error to the next piece of middleware
});

/* 
  error handler - for a handler with four parameters, 
  the first is assumed to be an error passed by another
  handler's "next"
 */
app.use((err, req, res, next) => {
  res.status(err.status || 500);
  return res.json({
    message: err.message,
    /*
         if we're in development mode, include stack trace (full error object)
         otherwise, it's an empty object so the user doesn't see all of that
        */
    error: app.get('env') === 'development' ? err : {}
  });
});

module.exports = app;
