const { Router } = require('express');
const { register, verifyEmailHandler } = require('../controllers/auth.controller');
const { registerValidationRules, handleValidationErrors } = require('../middleware/validate.middleware');

const router = Router();

/**
 * POST /api/v1/auth/register
 * Registers a new user and sends an email verification link.
 */
router.post('/register', registerValidationRules, handleValidationErrors, register);

/**
 * GET /api/v1/auth/verify-email?token=<raw_token>
 * Verifies a user's email address.
 */
router.get('/verify-email', verifyEmailHandler);

module.exports = router;
