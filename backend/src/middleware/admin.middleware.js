'use strict';

/**
 * Admin authorization middleware.
 * Must be used AFTER authenticate middleware.
 *
 * Returns 403 if the authenticated user does not have the 'admin' role.
 */
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required.' });
  }
  return next();
}

module.exports = { requireAdmin };
