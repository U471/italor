const { Router } = require('express');
const { register } = require('../controllers/auth.controller');
const { registerValidationRules, handleValidationErrors } = require('../middleware/validate.middleware');

const router = Router();

/**
 * POST /api/v1/auth/register
 * Registers a new user and sends an email verification link.
 */
router.post('/register', registerValidationRules, handleValidationErrors, register);

module.exports = router;
