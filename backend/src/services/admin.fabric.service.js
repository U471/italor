'use strict';

const Fabric = require('../models/Fabric');
const { cloudinary } = require('../middleware/upload.middleware');

const ALLOWED_FIELDS = [
  'name', 'description', 'material', 'color', 'pattern', 'price',
  'weight', 'origin', 'season', 'careInstructions', 'patternDescription',
  'tags', 'stock', 'isActive', 'thumbnailUrl',
];

/**
 * Returns ALL fabrics for admin (active + inactive), paginated.
 *
 * @param {object} params
 * @param {number} [params.page]
 * @param {number} [params.limit]
 * @returns {Promise<{ fabrics: object[], total: number, page: number, pages: number }>}
 */
async function adminListFabrics({ page, limit } = {}) {
  const parsedPage = Math.max(1, parseInt(page, 10) || 1);
  const parsedLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (parsedPage - 1) * parsedLimit;

  const [fabrics, total] = await Promise.all([
    Fabric.find({}).sort({ createdAt: -1 }).skip(skip).limit(parsedLimit).lean(),
    Fabric.countDocuments({}),
  ]);

  return { fabrics, total, page: parsedPage, pages: Math.ceil(total / parsedLimit) };
}

/**
 * Creates a new fabric.
 *
 * @param {object} data  Fabric fields
 * @returns {Promise<object>}
 */
async function adminCreateFabric(data) {
  const pick = {};
  ALLOWED_FIELDS.forEach((f) => { if (data[f] !== undefined) { pick[f] = data[f]; } });
  const fabric = await Fabric.create(pick);
  return fabric.toObject();
}

/**
 * Updates an existing fabric by id.
 * Returns null if not found.
 *
 * @param {string} id
 * @param {object} data
 * @returns {Promise<object|null>}
 */
async function adminUpdateFabric(id, data) {
  const pick = {};
  ALLOWED_FIELDS.forEach((f) => { if (data[f] !== undefined) { pick[f] = data[f]; } });

  const fabric = await Fabric.findByIdAndUpdate(id, { $set: pick }, { new: true, runValidators: true }).lean();
  return fabric || null;
}

/**
 * Soft-deletes a fabric by setting isActive = false.
 * Returns null if not found.
 *
 * @param {string} id
 * @returns {Promise<object|null>}
 */
async function adminDeleteFabric(id) {
  const fabric = await Fabric.findByIdAndUpdate(id, { $set: { isActive: false } }, { new: true }).lean();
  return fabric || null;
}

/**
 * Adds an image URL to a fabric's images array and updates thumbnailUrl if first image.
 * Returns the updated fabric, or null if not found.
 *
 * @param {string} id         Fabric ObjectId
 * @param {string} imageUrl   Cloudinary secure URL
 * @param {string} publicId   Cloudinary public_id for future deletion
 * @returns {Promise<object|null>}
 */
async function adminAddFabricImage(id, imageUrl, _publicId) {
  const fabric = await Fabric.findById(id);
  if (!fabric) { return null; }

  fabric.images.push(imageUrl);
  if (!fabric.thumbnailUrl) {
    fabric.thumbnailUrl = imageUrl;
    fabric.imageUrl = imageUrl;
  }
  await fabric.save();
  return fabric.toObject();
}

/**
 * Removes an image from a fabric's images array and deletes it from Cloudinary.
 *
 * @param {string} id       Fabric ObjectId
 * @param {string} imageUrl Image URL to remove
 * @returns {Promise<object|null>}
 */
async function adminRemoveFabricImage(id, imageUrl) {
  const fabric = await Fabric.findById(id);
  if (!fabric) { return null; }

  fabric.images = fabric.images.filter((img) => img !== imageUrl);
  if (fabric.thumbnailUrl === imageUrl) {
    fabric.thumbnailUrl = fabric.images[0] || null;
    fabric.imageUrl = fabric.thumbnailUrl;
  }

  // Extract and delete from Cloudinary
  try {
    const parts = imageUrl.split('/');
    const folderParts = parts.slice(parts.indexOf('italor'));
    const publicId = folderParts.join('/').replace(/\.[^.]+$/, '');
    await cloudinary.uploader.destroy(publicId);
  } catch (_err) {
    // Non-fatal — image may already be removed from Cloudinary
  }

  await fabric.save();
  return fabric.toObject();
}

module.exports = {
  adminListFabrics,
  adminCreateFabric,
  adminUpdateFabric,
  adminDeleteFabric,
  adminAddFabricImage,
  adminRemoveFabricImage,
};
