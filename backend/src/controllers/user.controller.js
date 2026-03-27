'use strict';

/**
 * User controller.
 *
 * Handles user-related endpoints. Auth state is already attached
 * to req.user by the authenticate middleware.
 */

/**
 * GET /api/v1/user/me
 * Returns the authenticated user's profile data from the JWT payload.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
function getMe(req, res) {
  const { userId, email, role } = req.user;
  return res.status(200).json({
    userId,
    email,
    role,
  });
}

module.exports = { getMe };
