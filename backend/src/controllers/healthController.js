/**
 * GET /api/v1/health
 * Returns service health status.
 */
function getHealth(req, res) {
  return res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
  });
}

module.exports = { getHealth };
