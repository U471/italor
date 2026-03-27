const { version } = require('../../package.json');

/**
 * GET /api/v1/health
 * AC: Returns { status: 'ok', timestamp, version }
 * Used by Railway rolling deployment health probe.
 */
const getHealth = (_req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version,
    environment: process.env.NODE_ENV || 'development',
    uptime: Math.floor(process.uptime()),
  });
};

module.exports = { getHealth };
