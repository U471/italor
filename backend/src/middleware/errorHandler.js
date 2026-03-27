/**
 * Global error handler middleware.
 * Must be the last middleware registered in app.js.
 */
function errorHandler(err, _req, res, _next) {
  const status = err.status || err.statusCode || 500;
  const message =
    process.env.NODE_ENV === 'production' && status === 500
      ? 'Internal server error'
      : err.message || 'Internal server error';

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
}

module.exports = { errorHandler };
