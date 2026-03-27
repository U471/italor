'use strict';

const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { cloudinary } = require('../middleware/upload.middleware');

const BCRYPT_ROUNDS = 12;

/**
 * Returns the full user profile from the database.
 *
 * @param {string} userId
 * @returns {Promise<object>} User document (sensitive fields excluded by toJSON)
 */
async function getUserProfile(userId) {
  const user = await User.findById(userId);
  if (!user) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }
  return user;
}

/**
 * Updates firstName, lastName, and/or phone for the given user.
 *
 * @param {string} userId
 * @param {{ firstName?: string, lastName?: string, phone?: string }} updates
 * @returns {Promise<object>} Updated user document
 */
async function updateUserProfile(userId, updates) {
  const allowed = {};
  if (updates.firstName !== undefined) { allowed.firstName = updates.firstName; }
  if (updates.lastName !== undefined) { allowed.lastName = updates.lastName; }
  if (updates.phone !== undefined) { allowed.phone = updates.phone; }

  const user = await User.findByIdAndUpdate(userId, allowed, {
    new: true,
    runValidators: true,
  });

  if (!user) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }

  return user;
}

/**
 * Changes the user's password after verifying their current one.
 *
 * @param {string} userId
 * @param {string} currentPassword
 * @param {string} newPassword
 * @returns {Promise<void>}
 */
async function changePassword(userId, currentPassword, newPassword) {
  const user = await User.findById(userId).select('+passwordHash');
  if (!user) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }

  const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!isMatch) {
    const err = new Error('Current password is incorrect');
    err.statusCode = 400;
    throw err;
  }

  user.passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
  await user.save();
}

/**
 * Updates the user's avatar URL and Cloudinary public ID.
 * Deletes the previous Cloudinary asset if one existed.
 *
 * @param {string} userId
 * @param {{ url: string, publicId: string }} avatarData
 * @returns {Promise<object>} Updated user document
 */
async function updateAvatar(userId, { url, publicId }) {
  const user = await User.findById(userId).select('+avatarPublicId');
  if (!user) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }

  // Delete old Cloudinary asset if present
  if (user.avatarPublicId) {
    try {
      await cloudinary.uploader.destroy(user.avatarPublicId);
    } catch {
      // Non-fatal — continue with update
    }
  }

  user.avatarUrl = url;
  user.avatarPublicId = publicId;
  await user.save();

  return user;
}

module.exports = { getUserProfile, updateUserProfile, changePassword, updateAvatar };
