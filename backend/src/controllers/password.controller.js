const { requestPasswordReset, resetPassword } = require('../services/password.service');

/**
 * POST /api/v1/auth/forgot-password
 *
 * Triggers a password reset email if the email exists.
 * Always returns 200 — never reveals whether the email is registered.
 *
 * Success  → 200 { message }
 * Errors   → 500 { error }
 */
async function forgotPassword(req, res) {
  try {
    const { email } = req.body;

    await requestPasswordReset(email);

    return res.status(200).json({
      message: 'If an account with that email exists, we have sent a password reset link.',
    });
  } catch (err) {
    process.stdout.write(
      JSON.stringify({
        level: 'error',
        context: 'password.controller',
        message: err.message,
        timestamp: new Date().toISOString(),
      }) + '\n'
    );
    return res.status(500).json({ error: 'Internal server error. Please try again later.' });
  }
}

/**
 * POST /api/v1/auth/reset-password
 *
 * Resets the user's password using a valid reset token from the URL/body.
 *
 * Success  → 200 { message }
 * Invalid  → 400 { error }   (expired / already-used / not-found token)
 * Errors   → 500 { error }
 */
async function resetPasswordHandler(req, res) {
  try {
    const { token, newPassword } = req.body;

    await resetPassword(token, newPassword);

    return res.status(200).json({ message: 'Your password has been reset successfully. You can now log in.' });
  } catch (err) {
    if (err.statusCode === 400) {
      return res.status(400).json({ error: err.message });
    }

    process.stdout.write(
      JSON.stringify({
        level: 'error',
        context: 'password.controller',
        message: err.message,
        timestamp: new Date().toISOString(),
      }) + '\n'
    );
    return res.status(500).json({ error: 'Internal server error. Please try again later.' });
  }
}

module.exports = { forgotPassword, resetPasswordHandler };
