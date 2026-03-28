'use strict';

const { getFabrics, getFabricFilterOptions, getFabricById, getFabricReviews, getRelatedFabrics } = require('../services/fabric.service');

/**
 * GET /api/v1/products
 * Returns paginated fabric catalog with optional filters, search, and sort.
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
 * Returns distinct values for material, color, and pattern.
 */
async function listFilterOptions(req, res, next) {
  try {
    const options = await getFabricFilterOptions();
    return res.status(200).json(options);
  } catch (err) {
    return next(err);
  }
}

/**
 * GET /api/v1/products/:id
 * Returns a single fabric with averageRating, reviewCount, and related fabrics.
 */
async function getFabric(req, res, next) {
  try {
    const fabric = await getFabricById(req.params.id);
    if (!fabric) {
      return res.status(404).json({ error: 'Fabric not found' });
    }
    const related = await getRelatedFabrics(fabric);
    return res.status(200).json({ fabric, related });
  } catch (err) {
    return next(err);
  }
}

/**
 * GET /api/v1/products/:id/reviews
 * Returns paginated reviews for a fabric.
 */
async function listFabricReviews(req, res, next) {
  try {
    const { page, limit } = req.query;
    const result = await getFabricReviews(req.params.id, { page, limit });
    return res.status(200).json(result);
  } catch (err) {
    return next(err);
  }
}

module.exports = { listFabrics, listFilterOptions, getFabric, listFabricReviews };
