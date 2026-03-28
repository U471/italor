'use strict';

const { createDesign, getDesignById, updateDesign, listUserDesigns } = require('../services/design.service');

/**
 * POST /api/v1/designs
 * Creates a new draft design. User is optional (guest sessions use sessionId).
 */
async function create(req, res, next) {
  try {
    const data = { ...req.body };
    if (req.user) { data.userId = req.user.userId; }

    const design = await createDesign(data);
    return res.status(201).json({ design });
  } catch (err) {
    return next(err);
  }
}

/**
 * GET /api/v1/designs/mine
 * Returns all designs belonging to the authenticated user.
 */
async function listMine(req, res, next) {
  try {
    const designs = await listUserDesigns(req.user.userId);
    return res.json({ designs });
  } catch (err) {
    return next(err);
  }
}

/**
 * GET /api/v1/designs/:id
 * Returns a design by id. Validates ownership.
 */
async function getOne(req, res, next) {
  try {
    const design = await getDesignById(req.params.id);
    if (!design) {
      const err = new Error('Design not found.');
      err.status = 404;
      return next(err);
    }

    // Ownership: must be the creator (user or matching sessionId)
    const ownedByUser = req.user && design.user && design.user.toString() === req.user.userId;
    const ownedBySession = design.sessionId && req.body.sessionId === design.sessionId;

    if (!ownedByUser && !ownedBySession) {
      const err = new Error('Forbidden.');
      err.status = 403;
      return next(err);
    }

    return res.json({ design });
  } catch (err) {
    return next(err);
  }
}

/**
 * PUT /api/v1/designs/:id
 * Updates a design step. Validates ownership.
 */
async function update(req, res, next) {
  try {
    const existing = await getDesignById(req.params.id);
    if (!existing) {
      const err = new Error('Design not found.');
      err.status = 404;
      return next(err);
    }

    const ownedByUser = req.user && existing.user && existing.user.toString() === req.user.userId;
    const ownedBySession = existing.sessionId && req.body.sessionId === existing.sessionId;

    if (!ownedByUser && !ownedBySession) {
      const err = new Error('Forbidden.');
      err.status = 403;
      return next(err);
    }

    const design = await updateDesign(req.params.id, req.body);
    return res.json({ design });
  } catch (err) {
    return next(err);
  }
}

module.exports = { create, listMine, getOne, update };
