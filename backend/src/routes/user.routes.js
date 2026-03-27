'use strict';

const { Router } = require('express');
const { authenticate } = require('../middleware/auth.middleware');
const { getMe } = require('../controllers/user.controller');

const router = Router();

/**
 * GET /api/v1/user/me
 * Returns the authenticated user's profile data.
 * Requires a valid Bearer token in the Authorization header.
 */
router.get('/me', authenticate, getMe);

module.exports = router;
