const { Router } = require('express');
const { register, login, refreshToken, logout } = require('../controllers/auth.controller');
const {
  registerValidationRules,
  loginValidationRules,
  handleValidationErrors,
} = require('../middleware/validate.middleware');

const router = Router();

/**
 * POST /api/v1/auth/register
 * Registers a new user and sends an email verification link.
 */
router.post('/register', registerValidationRules, handleValidationErrors, register);

/**
 * POST /api/v1/auth/login
 * Authenticates a user and returns an access token + sets refresh token cookie.
 */
router.post('/login', loginValidationRules, handleValidationErrors, login);

/**
 * POST /api/v1/auth/refresh-token
 * Issues a new access token using the refresh token cookie.
 */
router.post('/refresh-token', refreshToken);

/**
 * POST /api/v1/auth/logout
 * Clears the refresh token from DB and clears the cookie.
 */
router.post('/logout', logout);

module.exports = router;
