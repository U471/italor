'use strict';

const { getFabrics, getFabricFilterOptions } = require('../services/fabric.service');

/**
 * GET /api/v1/products
 * Returns paginated fabric catalog with optional filters, search, and sort.
 *
 * Query params:
 *   search, material, color, pattern, minPrice, maxPrice, sort, page, limit
 */
async function listFabrics(req, res, next) {
  try {
    const { search, material, color, pattern, minPrice, maxPrice, sort, page, limit } = req.query;

    const result = await getFabrics({ search, material, color, pattern, minPrice, maxPrice, sort, page, limit });

    return res.status(200).json(result);
  } catch (err) {
    return next(err);
  }
}

/**
 * GET /api/v1/products/filters
 * Returns distinct values for material, color, and pattern — used to populate filter UI.
 */
async function listFilterOptions(req, res, next) {
  try {
    const options = await getFabricFilterOptions();
    return res.status(200).json(options);
  } catch (err) {
    return next(err);
  }
}

module.exports = { listFabrics, listFilterOptions };
