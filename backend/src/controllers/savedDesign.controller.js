'use strict';

const savedDesignService = require('../services/savedDesign.service');

/**
 * POST /api/v1/saved-designs
 * Creates a new saved design for the authenticated user.
 */
async function createDesignHandler(req, res, next) {
  try {
    const design = await savedDesignService.createDesign(req.user.userId, req.body);
    return res.status(201).json({ status: 'success', data: { design } });
  } catch (err) {
    return next(err);
  }
}

/**
 * GET /api/v1/saved-designs
 * Returns all saved designs for the authenticated user.
 */
async function getDesignsHandler(req, res, next) {
  try {
    const designs = await savedDesignService.getDesigns(req.user.userId);
    return res.status(200).json({ status: 'success', data: { designs } });
  } catch (err) {
    return next(err);
  }
}

/**
 * GET /api/v1/saved-designs/:id
 * Returns a single saved design, validates ownership.
 */
async function getDesignByIdHandler(req, res, next) {
  try {
    const design = await savedDesignService.getDesignById(req.user.userId, req.params.id);
    return res.status(200).json({ status: 'success', data: { design } });
  } catch (err) {
    return next(err);
  }
}

/**
 * DELETE /api/v1/saved-designs/:id
 * Deletes a saved design, validates ownership.
 */
async function deleteDesignHandler(req, res, next) {
  try {
    await savedDesignService.deleteDesign(req.user.userId, req.params.id);
    return res.status(204).send();
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  createDesignHandler,
  getDesignsHandler,
  getDesignByIdHandler,
  deleteDesignHandler,
};
