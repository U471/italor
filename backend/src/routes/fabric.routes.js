'use strict';

const { Router } = require('express');
const { listFabrics, listFilterOptions } = require('../controllers/fabric.controller');

const router = Router();

/** GET /api/v1/products/filters — available filter options */
router.get('/filters', listFilterOptions);

/** GET /api/v1/products — paginated catalog with filters */
router.get('/', listFabrics);

module.exports = router;
