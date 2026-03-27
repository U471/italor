const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendVerificationEmail } = require('./email.service');

const BCRYPT_ROUNDS = 12;
const TOKEN_EXPIRY_HOURS = 24;

const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';

function getJwtSecret() {
  return process.env.JWT_SECRET || 'dev-secret-change-in-production';
}

/**
 * Registers a new user.
 *
 * Steps:
 *  1. Check for duplicate email (throws 409-style error if found).
 *  2. Hash the plaintext password with bcrypt (12 rounds).
 *  3. Generate a random verification token and hash it for storage.
 *  4. Persist the user document.
 *  5. Send a verification email with the raw token.
 *
 * @param {object} data
 * @param {string} data.firstName
 * @param {string} data.lastName
 * @param {string} data.email
 * @param {string} data.password  Plaintext password — NEVER stored.
 * @returns {Promise<User>} Saved user document (no passwordHash).
 */
async function registerUser({ firstName, lastName, email, password }) {
  // 1. Duplicate email check
  const existing = await User.findOne({ email: email.toLowerCase().trim() });
  if (existing) {
    const err = new Error('An account with this email already exists. Try logging in.');
    err.statusCode = 409;
    throw err;
  }

  // 2. Hash password
  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  // 3. Generate verification token (store hashed, send raw)
  const rawToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
  const verificationTokenExpiry = new Date(Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);

  // 4. Save user
  const user = await User.create({
    firstName,
    lastName,
    email,
    passwordHash,
    isVerified: false,
    verificationToken: hashedToken,
    verificationTokenExpiry,
  });

  // 5. Send verification email (non-blocking failure — do not let email errors fail registration)
  try {
    await sendVerificationEmail({
      toEmail: user.email,
      firstName: user.firstName,
      verificationToken: rawToken,
    });
  } catch (emailErr) {
    // Log and continue — user is already saved; they can request a resend later
    process.stdout.write(JSON.stringify({ level: 'warn', context: 'auth.service', message: 'Failed to send verification email', error: emailErr.message, timestamp: new Date().toISOString() }) + '\n');
  }

  return user;
}

/**
 * Generates a signed access token and a signed refresh token for the given user.
 *
 * @param {{ _id: string, email: string, role?: string }} user
 * @returns {{ accessToken: string, refreshToken: string }}
 */
function generateTokens(user) {
  const secret = getJwtSecret();

  const payload = {
    userId: user._id.toString(),
    email: user.email,
    role: user.role || 'user',
  };

  const accessToken = jwt.sign(payload, secret, { expiresIn: ACCESS_TOKEN_EXPIRY });
  const refreshToken = jwt.sign({ userId: user._id.toString() }, secret, {
    expiresIn: REFRESH_TOKEN_EXPIRY,
  });

  return { accessToken, refreshToken };
}

/**
 * Authenticates a user with email + password.
 *
 * Steps:
 *  1. Find user by email (select passwordHash explicitly).
 *  2. Compare plaintext password against stored hash.
 *  3. Generate access + refresh tokens.
 *  4. Hash refresh token and store in DB.
 *
 * @param {{ email: string, password: string }} credentials
 * @returns {Promise<{ accessToken: string, refreshToken: string, user: object }>}
 */
async function loginUser({ email, password }) {
  // 1. Find user (must select passwordHash since it has select:false)
  const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+passwordHash');

  if (!user) {
    const err = new Error('Invalid email or password');
    err.statusCode = 401;
    throw err;
  }

  // 2. Compare password
  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    const err = new Error('Invalid email or password');
    err.statusCode = 401;
    throw err;
  }

  // 3. Generate tokens
  const { accessToken, refreshToken } = generateTokens(user);

  // 4. Hash refresh token and store in DB
  const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
  await User.findByIdAndUpdate(user._id, { refreshTokenHash });

  return { accessToken, refreshToken, user };
}

/**
 * Issues a new access token from a valid refresh token cookie.
 *
 * Steps:
 *  1. Verify the JWT signature and expiry.
 *  2. Find the user and compare hashed token against DB.
 *  3. Generate and return a new access token.
 *
 * @param {string} refreshToken  Raw refresh token from cookie.
 * @returns {Promise<{ accessToken: string }>}
 */
async function refreshAccessToken(refreshToken) {
  const secret = getJwtSecret();

  let payload;
  try {
    payload = jwt.verify(refreshToken, secret);
  } catch {
    const err = new Error('Invalid or expired refresh token');
    err.statusCode = 401;
    throw err;
  }

  // Find user and compare hashed token
  const user = await User.findById(payload.userId).select('+refreshTokenHash');
  if (!user) {
    const err = new Error('Invalid or expired refresh token');
    err.statusCode = 401;
    throw err;
  }

  const incomingHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
  if (!user.refreshTokenHash || user.refreshTokenHash !== incomingHash) {
    const err = new Error('Invalid or expired refresh token');
    err.statusCode = 401;
    throw err;
  }

  // Issue new access token only (keep same refresh token)
  const accessToken = jwt.sign(
    { userId: user._id.toString(), email: user.email, role: user.role || 'user' },
    secret,
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );

  return { accessToken };
}

/**
 * Logs out a user by clearing their refresh token from the DB.
 *
 * @param {string} refreshToken  Raw refresh token from cookie.
 * @returns {Promise<void>}
 */
async function logoutUser(refreshToken) {
  if (!refreshToken) { return; }

  const secret = getJwtSecret();

  let payload;
  try {
    payload = jwt.verify(refreshToken, secret);
  } catch {
    // Token already invalid — nothing to clear
    return;
  }

  await User.findByIdAndUpdate(payload.userId, { refreshTokenHash: null });
}

module.exports = { registerUser, loginUser, generateTokens, refreshAccessToken, logoutUser };
