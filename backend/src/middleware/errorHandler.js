/**
 * Central error handling middleware.
 * Must have 4 parameters so Express recognises it as an error handler.
 */
const errorHandler = (err, _req, res, _next) => {
  const status = err.status || err.statusCode || 500;
  const message =
    process.env.NODE_ENV === 'production' && status === 500
      ? 'Internal server error'
      : err.message || 'Internal server error';

  // Structured error log to stdout (avoids console.log lint rule)
  process.stdout.write(
    JSON.stringify({
      level: 'error',
      message: err.message,
      stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined,
      status,
      timestamp: new Date().toISOString(),
    }) + '\n'
  );

  res.status(status).json({ error: message });
};

module.exports = { errorHandler };
