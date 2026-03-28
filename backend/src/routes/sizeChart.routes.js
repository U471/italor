const express = require('express');
const { STANDARD_SIZE_LABELS, STANDARD_SIZES } = require('../constants/standardSizes');

const router = express.Router();

/**
 * GET /api/v1/size-chart
 * Returns the full standard size chart (public, no auth required).
 */
router.get('/', (req, res) => {
  res.status(200).json({
    status: 'success',
    data: {
      sizes: STANDARD_SIZE_LABELS,
      chart: STANDARD_SIZES,
    },
  });
});

module.exports = router;
