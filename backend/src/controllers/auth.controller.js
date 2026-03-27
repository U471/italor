const { registerUser, loginUser, refreshAccessToken, logoutUser } = require('../services/auth.service');

const REFRESH_TOKEN_COOKIE = 'refreshToken';
const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'strict',
  secure: process.env.NODE_ENV === 'production',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
};

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

    process.stdout.write(JSON.stringify({ level: 'error', context: 'auth.controller', message: err.message, timestamp: new Date().toISOString() }) + '\n');
    return res.status(500).json({ error: 'Internal server error. Please try again later.' });
  }
}

/**
 * POST /api/v1/auth/login
 *
 * Authenticates a user and issues JWT tokens.
 *
 * Success  → 200 { message, accessToken, user }
 *            Set-Cookie: refreshToken (httpOnly)
 * Invalid  → 401 { error }
 * Errors   → 500 { error }
 */
async function login(req, res) {
  try {
    const { email, password } = req.body;

    const { accessToken, refreshToken, user } = await loginUser({ email, password });

    // Set refresh token as httpOnly cookie
    res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, COOKIE_OPTIONS);

    return res.status(200).json({
      message: 'Login successful.',
      accessToken,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        isVerified: user.isVerified,
      },
    });
  } catch (err) {
    if (err.statusCode === 401) {
      return res.status(401).json({ error: err.message });
    }

    process.stdout.write(JSON.stringify({ level: 'error', context: 'auth.controller', message: err.message, timestamp: new Date().toISOString() }) + '\n');
    return res.status(500).json({ error: 'Internal server error. Please try again later.' });
  }
}

/**
 * POST /api/v1/auth/refresh-token
 *
 * Issues a new access token using a valid refresh token cookie.
 *
 * Success  → 200 { accessToken }
 * Invalid  → 401 { error }
 * Errors   → 500 { error }
 */
async function refreshToken(req, res) {
  try {
    const token = req.cookies && req.cookies[REFRESH_TOKEN_COOKIE];

    if (!token) {
      return res.status(401).json({ error: 'Refresh token not found' });
    }

    const { accessToken } = await refreshAccessToken(token);

    return res.status(200).json({ accessToken });
  } catch (err) {
    if (err.statusCode === 401) {
      return res.status(401).json({ error: err.message });
    }

    process.stdout.write(JSON.stringify({ level: 'error', context: 'auth.controller', message: err.message, timestamp: new Date().toISOString() }) + '\n');
    return res.status(500).json({ error: 'Internal server error. Please try again later.' });
  }
}

/**
 * POST /api/v1/auth/logout
 *
 * Clears the refresh token from DB and clears the cookie.
 *
 * Success → 200 { message }
 */
async function logout(req, res) {
  try {
    const token = req.cookies && req.cookies[REFRESH_TOKEN_COOKIE];

    await logoutUser(token);

    res.clearCookie(REFRESH_TOKEN_COOKIE, {
      httpOnly: true,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
    });

    return res.status(200).json({ message: 'Logged out successfully.' });
  } catch (err) {
    process.stdout.write(JSON.stringify({ level: 'error', context: 'auth.controller', message: err.message, timestamp: new Date().toISOString() }) + '\n');
    return res.status(500).json({ error: 'Internal server error. Please try again later.' });
  }
}

module.exports = { register, login, refreshToken, logout };
