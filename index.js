const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const morgan = require('morgan');
const userRoutes = require('./routes/users');
const userAuth = require('./routes/user-auth');
const companyAuth = require('./routes/company-auth');
const companyRoutes = require('./routes/companies');
const jobRoutes = require('./routes/jobs');
const userJobRoutes = require('./routes/jobs_users');
const applicationRoutes = require('./routes/applications');
const cors = require('cors');
const APIError = require('./APIError');

app.use(cors());
app.use(bodyParser.json());
app.use(morgan('dev'));
app.use('/users', userRoutes);
app.post('/user-auth', userAuth);
app.post('/company-auth', companyAuth);
app.use('/companies', companyRoutes);
app.use('/jobs', jobRoutes);
app.use('/jobs_users', userJobRoutes);
app.use('/jobs/:job_id/applications', applicationRoutes);

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

// at the bottom of index.js (app file), use this global error handler
app.use((error, request, response, next) => {
  // format built-in errors
  //console.error(error);
  if (!(error instanceof APIError)) {
    error = new APIError(404, 'Not Found', 'Invalid URL.');
  }
  // log the error stack if we're in development

  return response.status(error.status).json(error);
});

// old error handler
// app.use((err, req, res, next) => {
//   if (Array.isArray(err)) {
//     err.message = err.join(' | ');
//   }
//   return res.status(err.status || 500).json({
//     error: {
//       message: err.message,
//       status: err.status || 500
//     }
//   });
// });

module.exports = app;
