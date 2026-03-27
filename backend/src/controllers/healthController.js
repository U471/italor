/**
 * GET /api/v1/health
 * Returns service health status.
 */
const { version } = require('../../package.json');

function getHealth(_req, res) {
  return res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version,
    environment: process.env.NODE_ENV || 'development',
    uptime: Math.floor(process.uptime()),
  });
}

module.exports = { getHealth };
