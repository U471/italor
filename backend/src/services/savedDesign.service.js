'use strict';

const Design = require('../models/Design');

const MAX_DESIGNS = 10;

/**
 * Creates a new saved design for the user.
 * Enforces a maximum of MAX_DESIGNS per user.
 *
 * @param {string} userId
 * @param {{ name?: string, suitConfig: object, previewImageUrl?: string }} payload
 * @returns {Promise<object>}
 */
async function createDesign(userId, { name, suitConfig, previewImageUrl }) {
  const count = await Design.countDocuments({ userId });
  if (count >= MAX_DESIGNS) {
    const err = new Error(
      `Maximum of ${MAX_DESIGNS} saved designs allowed. Please delete one first.`
    );
    err.status = 400;
    throw err;
  }
  const designName = name || `My Suit Design ${count + 1}`;
  return Design.create({ userId, name: designName, suitConfig, previewImageUrl: previewImageUrl || '' });
}

/**
 * Returns all saved designs for a user, newest first.
 *
 * @param {string} userId
 * @returns {Promise<object[]>}
 */
async function getDesigns(userId) {
  return Design.find({ userId }).sort({ createdAt: -1 }).lean();
}

/**
 * Returns a single saved design, validating ownership.
 *
 * @param {string} userId
 * @param {string} designId
 * @returns {Promise<object>}
 */
async function getDesignById(userId, designId) {
  const design = await Design.findOne({ _id: designId, userId }).lean();
  if (!design) {
    const err = new Error('Design not found');
    err.status = 404;
    throw err;
  }
  return design;
}

/**
 * Deletes a saved design, validating ownership.
 *
 * @param {string} userId
 * @param {string} designId
 * @returns {Promise<object>}
 */
async function deleteDesign(userId, designId) {
  const design = await Design.findOneAndDelete({ _id: designId, userId });
  if (!design) {
    const err = new Error('Design not found');
    err.status = 404;
    throw err;
  }
  return design;
}

module.exports = { createDesign, getDesigns, getDesignById, deleteDesign };
