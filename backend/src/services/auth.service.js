const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { sendVerificationEmail } = require('./email.service');

const BCRYPT_ROUNDS = 12;
const TOKEN_EXPIRY_HOURS = 24;

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

const verifyEmail = async (rawToken) => {
  const hashed = crypto.createHash('sha256').update(rawToken).digest('hex');
  const user = await User.findOne({
    verificationToken: hashed,
    verificationTokenExpiry: { $gt: Date.now() },
  }).select('+verificationToken +verificationTokenExpiry');
  if (!user) {
    const err = new Error('Invalid or expired verification token');
    err.statusCode = 400;
    throw err;
  }
  user.isVerified = true;
  user.verificationToken = undefined;
  user.verificationTokenExpiry = undefined;
  await user.save();
  return user;
};

module.exports = { registerUser, verifyEmail };
