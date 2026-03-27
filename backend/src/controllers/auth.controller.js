const { registerUser } = require('../services/auth.service');

/**
 * POST /api/v1/auth/register
 *
 * Registers a new user account.
 *
 * Success  → 201 { message, user: { id, firstName, lastName, email, isVerified, createdAt } }
 * Conflict → 409 { error }
 * Errors   → 500 { error }
 */
async function register(req, res) {
  try {
    const { firstName, lastName, email, password } = req.body;

    const user = await registerUser({ firstName, lastName, email, password });

    return res.status(201).json({
      message: 'Registration successful. Please check your email to verify your account.',
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        isVerified: user.isVerified,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    if (err.statusCode === 409) {
      return res.status(409).json({ error: err.message });
    }

    console.error('[auth.controller] register error:', err);
    return res.status(500).json({ error: 'Internal server error. Please try again later.' });
  }
}

module.exports = { register };
