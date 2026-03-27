/**
 * 404 handler middleware.
 * Catches all unmatched routes and returns a consistent JSON 404 response.
 */
function notFoundHandler(req, res) {
  return res.status(404).json({ error: `Route ${req.method} ${req.originalUrl} not found` });
}

module.exports = { notFoundHandler };
