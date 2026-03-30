'use strict';

const { body, param, query, validationResult } = require('express-validator');
const reviewService = require('../services/review.service');

// ── Validation rule sets ──────────────────────────────────────────────────────

/**
 * Validation rules for POST /api/v1/products/:fabricId/reviews
 */
const createReviewRules = [
  param('fabricId').isMongoId().withMessage('fabricId must be a valid MongoDB ObjectId'),
  body('orderId').isMongoId().withMessage('orderId must be a valid MongoDB ObjectId'),
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('rating must be an integer between 1 and 5'),
  body('title')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 200 })
    .withMessage('title cannot exceed 200 characters'),
  body('body')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 20, max: 2000 })
    .withMessage('body must be between 20 and 2000 characters'),
  body('fitRating')
    .optional({ nullable: true })
    .isInt({ min: 1, max: 5 })
    .withMessage('fitRating must be an integer between 1 and 5'),
];

/**
 * Validation rules for GET /api/v1/reviews/my
 */
const listMyReviewsRules = [
  query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('limit must be between 1 and 50'),
];

/**
 * Validation rules for DELETE /api/v1/reviews/:id
 */
const reviewIdParamRules = [
  param('id').isMongoId().withMessage('id must be a valid MongoDB ObjectId'),
];

// ── Controller functions ──────────────────────────────────────────────────────

/**
 * POST /api/v1/products/:fabricId/reviews
 *
 * Creates a new review for a fabric.
 * Requires a delivered order that contains that fabric item.
 */
async function createReview(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ status: 'error', errors: errors.array() });
    }

    const { orderId, rating, title, body: reviewBody, fitRating } = req.body;

    const review = await reviewService.createReview(
      req.user.userId,
      req.params.fabricId,
      orderId,
      { rating, title, body: reviewBody, fitRating }
    );

    return res.status(201).json({ status: 'success', data: { review } });
  } catch (err) {
    return next(err);
  }
}

/**
 * GET /api/v1/reviews/my
 *
 * Returns all reviews written by the authenticated user, newest first.
 */
async function listMyReviews(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ status: 'error', errors: errors.array() });
    }

    const { page, limit } = req.query;
    const result = await reviewService.getReviewsByUser(req.user.userId, { page, limit });

    return res.json({ status: 'success', data: result });
  } catch (err) {
    return next(err);
  }
}

/**
 * DELETE /api/v1/reviews/:id
 *
 * Deletes a review. Only the review author or an admin may delete.
 */
async function deleteReview(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ status: 'error', errors: errors.array() });
    }

    await reviewService.deleteReview(req.params.id, req.user.userId, req.user.role);

    return res.json({ status: 'success', message: 'Review deleted' });
  } catch (err) {
    return next(err);
  }
}

/**
 * POST /api/v1/reviews/:id/helpful
 *
 * Increments the helpful votes counter for a review.
 * Each authenticated user may vote only once per review.
 */
async function markHelpful(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ status: 'error', errors: errors.array() });
    }

    const result = await reviewService.markHelpful(req.params.id, req.user.userId);

    return res.json({ status: 'success', data: result });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  createReview,
  listMyReviews,
  deleteReview,
  markHelpful,
  createReviewRules,
  listMyReviewsRules,
  reviewIdParamRules,
};
