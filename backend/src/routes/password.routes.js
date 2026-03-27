const { Router } = require('express');
const { body } = require('express-validator');
const { forgotPassword, resetPasswordHandler } = require('../controllers/password.controller');
const { handleValidationErrors } = require('../middleware/validate.middleware');

const router = Router();

/**
 * POST /api/v1/auth/forgot-password
 * Sends a password reset email if the email is registered.
 * Always returns 200 to avoid leaking account existence.
 */
router.post(
  '/forgot-password',
  [
    body('email')
      .trim()
      .notEmpty()
      .withMessage('Email is required')
      .isEmail()
      .withMessage('Please enter a valid email address')
      .normalizeEmail(),
  ],
  handleValidationErrors,
  forgotPassword
);

/**
 * POST /api/v1/auth/reset-password
 * Resets the user's password using a valid token.
 */
router.post(
  '/reset-password',
  [
    body('token')
      .trim()
      .notEmpty()
      .withMessage('Reset token is required'),

    body('newPassword')
      .notEmpty()
      .withMessage('New password is required')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long')
      .matches(/[A-Z]/)
      .withMessage('Password must contain at least one uppercase letter')
      .matches(/[0-9]/)
      .withMessage('Password must contain at least one number'),
  ],
  handleValidationErrors,
  resetPasswordHandler
);

module.exports = router;
