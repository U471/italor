'use strict';

const express = require('express');
const { authenticate } = require('../middleware/auth.middleware');
const {
  listMyReviews,
  deleteReview,
  markHelpful,
  listMyReviewsRules,
  reviewIdParamRules,
} = require('../controllers/review.controller');

const router = express.Router();

// All review management routes require authentication
router.use(authenticate);

/**
 * GET /api/v1/reviews/my
 * Returns paginated reviews written by the authenticated user.
 */
router.get('/my', listMyReviewsRules, listMyReviews);

/**
 * DELETE /api/v1/reviews/:id
 * Deletes a review. Only the author or admin can delete.
 */
router.delete('/:id', reviewIdParamRules, deleteReview);

/**
 * POST /api/v1/reviews/:id/helpful
 * Marks a review as helpful (one vote per user).
 */
router.post('/:id/helpful', reviewIdParamRules, markHelpful);

module.exports = router;
