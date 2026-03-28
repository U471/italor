'use strict';

const { Router } = require('express');
const { authenticate } = require('../middleware/auth.middleware');
const { create, listMine, getOne, update } = require('../controllers/design.controller');

const router = Router();

/**
 * POST /api/v1/designs
 * Create a new draft design (auth optional — guest designs use sessionId).
 * authenticate is called but failures are swallowed via optionalAuth pattern below.
 */
router.post('/', optionalAuth, create);

/**
 * GET /api/v1/designs/mine
 * List authenticated user's designs.
 */
router.get('/mine', authenticate, listMine);

/**
 * GET /api/v1/designs/:id
 * Fetch a single design (ownership validated in controller).
 */
router.get('/:id', optionalAuth, getOne);

/**
 * PUT /api/v1/designs/:id
 * Update a design step (ownership validated in controller).
 */
router.put('/:id', optionalAuth, update);

/**
 * Middleware that runs authenticate but continues even if token is missing/invalid.
 * This allows both authenticated and guest access to the same endpoint.
 */
function optionalAuth(req, res, next) {
  authenticate(req, res, (err) => {
    if (err) {
      // Token present but invalid — propagate the error
      if (req.headers.authorization) { return next(err); }
      // No token — continue as guest
      return next();
    }
    return next();
  });
}

module.exports = router;
