'use strict';

const { Router } = require('express');
const { listFabrics, listFilterOptions, getFabric, listFabricReviews } = require('../controllers/fabric.controller');

const router = Router();

/** GET /api/v1/products/filters — available filter options */
router.get('/filters', listFilterOptions);

/** GET /api/v1/products — paginated catalog with filters */
router.get('/', listFabrics);

/** GET /api/v1/products/:id — single fabric detail with related */
router.get('/:id', getFabric);

/** GET /api/v1/products/:id/reviews — paginated reviews for a fabric */
router.get('/:id/reviews', listFabricReviews);

module.exports = router;
