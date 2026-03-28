'use strict';

const SuitDesign = require('../models/SuitDesign');

const ALLOWED_SECTIONS = ['fabric', 'fabricSnapshot', 'style', 'lapel', 'lining', 'details', 'monogram', 'status'];

/**
 * Creates a new draft SuitDesign.
 *
 * @param {object} data  { userId?, sessionId?, fabric?, fabricSnapshot?, ... }
 * @returns {Promise<object>}
 */
async function createDesign(data) {
  const pick = {};
  if (data.userId) { pick.user = data.userId; }
  if (data.sessionId) { pick.sessionId = data.sessionId; }
  ALLOWED_SECTIONS.forEach((s) => { if (data[s] !== undefined) { pick[s] = data[s]; } });

  const design = await SuitDesign.create(pick);
  return design.toObject();
}

/**
 * Returns a design by id.
 * Caller must verify ownership (user or sessionId match) after fetching.
 *
 * @param {string} id
 * @returns {Promise<object|null>}
 */
async function getDesignById(id) {
  const design = await SuitDesign.findById(id).lean();
  return design || null;
}

/**
 * Partially updates a design by id.
 * Returns null if not found.
 *
 * @param {string} id
 * @param {object} data  Any subset of design sections
 * @returns {Promise<object|null>}
 */
async function updateDesign(id, data) {
  const pick = {};
  ALLOWED_SECTIONS.forEach((s) => { if (data[s] !== undefined) { pick[s] = data[s]; } });

  const design = await SuitDesign.findByIdAndUpdate(
    id,
    { $set: pick },
    { new: true, runValidators: true }
  ).lean();
  return design || null;
}

/**
 * Lists all saved designs for a user (status = 'saved').
 *
 * @param {string} userId
 * @returns {Promise<object[]>}
 */
async function listUserDesigns(userId) {
  return SuitDesign.find({ user: userId, status: { $in: ['saved', 'draft'] } })
    .sort({ updatedAt: -1 })
    .lean();
}

module.exports = { createDesign, getDesignById, updateDesign, listUserDesigns };
