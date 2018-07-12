class APIError extends Error {
  constructor(
    status = 500,
    title = 'Internal Server Error',
    message = 'Uh-Oh'
  ) {
    super(message); // call parent class constructor (Error) with message
    this.status = status;
    this.title = title;
    this.message = message;
    // stack trace to track which line had the error
    // include the normal error stack trace for API
    Error.captureStackTrace(this);
  }
  toJSON() {
    return {
      error: {
        status: this.status,
        title: this.title,
        message: this.message
      }
    };
  }
}

// const testError = new APIError(401, 'Unquthorized', 'You must auth first.');
// next(testError);
// next(new APIError(401, 'Unquthorized', 'You must auth first.'));

module.exports = APIError;
