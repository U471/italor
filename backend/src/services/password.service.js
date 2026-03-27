const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { sendPasswordResetEmail } = require('./email.service');

const BCRYPT_ROUNDS = 12;
const RESET_TOKEN_EXPIRY_HOURS = 1;

/**
 * Initiates a password reset flow for the given email.
 *
 * Steps:
 *  1. Look up the user by email.
 *  2. If not found, return silently (never reveal whether email exists).
 *  3. Generate a random token; store its SHA-256 hash + expiry in the user document.
 *  4. Send the raw token to the user's email.
 *
 * @param {string} email  Plaintext email address submitted by the user.
 * @returns {Promise<void>}
 */
async function requestPasswordReset(email) {
  const user = await User.findOne({ email: email.toLowerCase().trim() });

  // Always return silently — do not reveal whether the email exists in the system
  if (!user) {
    return;
  }

  // Generate reset token (store hashed, send raw)
  const rawToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
  const resetPasswordExpiry = new Date(Date.now() + RESET_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);

  // Persist token hash + expiry
  await User.findByIdAndUpdate(user._id, {
    resetPasswordToken: hashedToken,
    resetPasswordExpiry,
  });

  // Send reset email (non-blocking failure — user can retry)
  try {
    await sendPasswordResetEmail({
      toEmail: user.email,
      firstName: user.firstName,
      resetToken: rawToken,
    });
  } catch (emailErr) {
    process.stdout.write(
      JSON.stringify({
        level: 'warn',
        context: 'password.service',
        message: 'Failed to send password reset email',
        error: emailErr.message,
        timestamp: new Date().toISOString(),
      }) + '\n'
    );
  }
}

/**
 * Resets the user's password using a valid reset token.
 *
 * Steps:
 *  1. Hash the incoming raw token and look up user by hash + unexpired expiry.
 *  2. If not found, throw a 400-style error (invalid/expired token).
 *  3. Bcrypt-hash the new password and save it.
 *  4. Clear reset token fields and refreshTokenHash (invalidate all sessions).
 *
 * @param {string} token        Raw reset token from the URL query string.
 * @param {string} newPassword  New plaintext password chosen by the user.
 * @returns {Promise<void>}
 */
async function resetPassword(token, newPassword) {
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  // Find user with matching token hash that has not yet expired
  // Note: resetPasswordToken has select:false so we must explicitly include it.
  // We use a raw mongoose query with select to get the field back for verification.
  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpiry: { $gt: new Date() },
  });

  if (!user) {
    const err = new Error('This reset link has expired. Please request a new one.');
    err.statusCode = 400;
    throw err;
  }

  // Hash new password
  const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

  // Save new password and clear all token/session fields
  await User.findByIdAndUpdate(user._id, {
    passwordHash,
    resetPasswordToken: undefined,
    resetPasswordExpiry: undefined,
    refreshTokenHash: null,
  });
}

module.exports = { requestPasswordReset, resetPassword };
