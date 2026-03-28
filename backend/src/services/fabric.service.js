'use strict';

const Fabric = require('../models/Fabric');

const DEFAULT_LIMIT = 24;
const MAX_LIMIT = 100;

const SORT_MAP = {
  price_asc: { price: 1 },
  price_desc: { price: -1 },
  name_asc: { name: 1 },
  name_desc: { name: -1 },
  newest: { createdAt: -1 },
};

/**
 * Queries the fabric catalog with optional filters, search, sort, and pagination.
 *
 * @param {object} params
 * @param {string} [params.search]      Full-text search query
 * @param {string} [params.material]    Filter by material
 * @param {string} [params.color]       Filter by color
 * @param {string} [params.pattern]     Filter by pattern
 * @param {number} [params.minPrice]    Minimum price
 * @param {number} [params.maxPrice]    Maximum price
 * @param {string} [params.sort]        Sort key from SORT_MAP (default: newest)
 * @param {number} [params.page]        Page number (1-based, default: 1)
 * @param {number} [params.limit]       Items per page (default: 24, max: 100)
 * @returns {Promise<{ fabrics: object[], total: number, page: number, pages: number, limit: number }>}
 */
async function getFabrics({ search, material, color, pattern, minPrice, maxPrice, sort, page, limit } = {}) {
  const filter = { isActive: true };

  // Full-text search
  if (search && search.trim()) {
    filter.$text = { $search: search.trim() };
  }

  // Exact filters
  if (material) { filter.material = material.toLowerCase(); }
  if (color) { filter.color = color.toLowerCase(); }
  if (pattern) { filter.pattern = pattern.toLowerCase(); }

  // Price range
  if (minPrice !== undefined || maxPrice !== undefined) {
    filter.price = {};
    if (minPrice !== undefined) { filter.price.$gte = Number(minPrice); }
    if (maxPrice !== undefined) { filter.price.$lte = Number(maxPrice); }
  }

  // Pagination
  const parsedPage = Math.max(1, parseInt(page, 10) || 1);
  const parsedLimit = Math.min(MAX_LIMIT, Math.max(1, parseInt(limit, 10) || DEFAULT_LIMIT));
  const skip = (parsedPage - 1) * parsedLimit;

  // Sorting — if text search, also sort by text score
  let sortOption = SORT_MAP[sort] || SORT_MAP.newest;
  if (filter.$text) {
    sortOption = { score: { $meta: 'textScore' }, ...sortOption };
  }

  const [fabrics, total] = await Promise.all([
    Fabric.find(filter, filter.$text ? { score: { $meta: 'textScore' } } : {})
      .sort(sortOption)
      .skip(skip)
      .limit(parsedLimit)
      .lean(),
    Fabric.countDocuments(filter),
  ]);

  return {
    fabrics,
    total,
    page: parsedPage,
    pages: Math.ceil(total / parsedLimit),
    limit: parsedLimit,
  };
}

/**
 * Returns distinct values for filter options (material, color, pattern).
 * Used to populate filter sidebar dropdowns.
 *
 * @returns {Promise<{ materials: string[], colors: string[], patterns: string[] }>}
 */
async function getFabricFilterOptions() {
  const [materials, colors, patterns] = await Promise.all([
    Fabric.distinct('material', { isActive: true }),
    Fabric.distinct('color', { isActive: true }),
    Fabric.distinct('pattern', { isActive: true }),
  ]);

  return { materials, colors, patterns };
}

module.exports = { getFabrics, getFabricFilterOptions };
