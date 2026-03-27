/**
 * Global error handler middleware.
 * Must be the last middleware registered in app.js.
 */
function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Internal Server Error';

  if (process.env.NODE_ENV !== 'test') {
    process.stdout.write(JSON.stringify({ level: 'error', context: 'errorHandler', status: statusCode, message, stack: err.stack, timestamp: new Date().toISOString() }) + '\n');
  }

  return res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}

module.exports = { errorHandler };
