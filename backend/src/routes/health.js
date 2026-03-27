const { Router } = require('express');
const { getHealth } = require('../controllers/healthController');

const router = Router();

/**
 * GET /api/v1/health
 * Returns service liveness status.
 * Used by Railway health checks, CI/CD pipeline, and uptime monitors.
 */
router.get('/', getHealth);

module.exports = router;
