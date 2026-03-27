'use strict';

const {
  getUserProfile,
  updateUserProfile,
  changePassword,
  updateAvatar,
} = require('../services/user.service');

/**
 * GET /api/v1/user/me
 * Returns the authenticated user's full profile from the database.
 */
async function getMe(req, res, next) {
  try {
    const user = await getUserProfile(req.user.userId);
    return res.status(200).json({ user });
  } catch (err) {
    return next(err);
  }
}

/**
 * PUT /api/v1/user/me
 * Updates the authenticated user's profile (firstName, lastName, phone).
 */
async function updateMe(req, res, next) {
  try {
    const { firstName, lastName, phone } = req.body;
    const user = await updateUserProfile(req.user.userId, { firstName, lastName, phone });
    return res.status(200).json({ message: 'Profile updated successfully.', user });
  } catch (err) {
    return next(err);
  }
}

/**
 * PUT /api/v1/user/me/password
 * Changes the authenticated user's password.
 * Requires: currentPassword, newPassword in request body.
 */
async function updatePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      const err = new Error('currentPassword and newPassword are required');
      err.statusCode = 400;
      return next(err);
    }

    await changePassword(req.user.userId, currentPassword, newPassword);
    return res.status(200).json({ message: 'Password changed successfully.' });
  } catch (err) {
    return next(err);
  }
}

/**
 * PUT /api/v1/user/me/avatar
 * Uploads a new avatar image. File is handled by multer-storage-cloudinary.
 */
async function updateAvatarHandler(req, res, next) {
  try {
    if (!req.file) {
      const err = new Error('No image file provided');
      err.statusCode = 400;
      return next(err);
    }

    const user = await updateAvatar(req.user.userId, {
      url: req.file.path,
      publicId: req.file.filename,
    });

    return res.status(200).json({ message: 'Avatar updated successfully.', avatarUrl: user.avatarUrl });
  } catch (err) {
    return next(err);
  }
}

module.exports = { getMe, updateMe, updatePassword, updateAvatarHandler };
