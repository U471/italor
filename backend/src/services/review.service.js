'use strict';

const Review = require('../models/Review');
const Order = require('../models/Order');
const User = require('../models/User');

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

/**
 * Creates a review for a fabric, enforcing:
 *  - The order must belong to the authenticated user.
 *  - The order must have status "delivered".
 *  - The order must contain an item with the given fabricId.
 *  - The user has not already reviewed this order item.
 *
 * @param {string} userId     Authenticated user's MongoDB ObjectId string
 * @param {string} fabricId   MongoDB ObjectId string of the fabric being reviewed
 * @param {string} orderId    MongoDB ObjectId string of the qualifying order
 * @param {{ rating: number, title?: string, body?: string, fitRating?: number }} payload
 * @returns {Promise<object>} The saved review document
 */
async function createReview(userId, fabricId, orderId, { rating, title = '', body = '', fitRating = null }) {
  // 1. Verify order belongs to user and is delivered
  const order = await Order.findOne({ _id: orderId, user: userId }).lean();
  if (!order) {
    const err = new Error('Order not found');
    err.status = 404;
    throw err;
  }

  if (order.status !== 'delivered') {
    const err = new Error('You can only review items from delivered orders');
    err.status = 422;
    throw err;
  }

  // 2. Verify the order contains the specified fabric
  const hasItem = order.items.some((item) => item.fabricId && item.fabricId.toString() === fabricId.toString());
  if (!hasItem) {
    const err = new Error('This fabric is not part of the specified order');
    err.status = 422;
    throw err;
  }

  // 3. Check for duplicate review (same user + order)
  const existing = await Review.findOne({ user: userId, order: orderId }).lean();
  if (existing) {
    const err = new Error('You have already reviewed this item. You can edit your existing review.');
    err.status = 409;
    throw err;
  }

  // 4. Fetch user display name
  const user = await User.findById(userId).select('firstName lastName').lean();
  const displayName = user ? `${user.firstName} ${user.lastName[0]}.`.trim() : 'Anonymous';

  // 5. Persist review
  const review = await Review.create({
    fabric: fabricId,
    user: userId,
    order: orderId,
    displayName,
    rating,
    title: title || '',
    body: body || '',
    fitRating: fitRating || null,
    isVerifiedPurchase: true,
  });

  return review;
}

/**
 * Returns paginated reviews for a specific fabric.
 *
 * @param {string} fabricId    MongoDB ObjectId string
 * @param {{ page?: number, limit?: number }} params
 * @returns {Promise<{ reviews: object[], total: number, page: number, pages: number }>}
 */
async function getReviewsByFabric(fabricId, { page, limit } = {}) {
  const parsedPage = Math.max(1, parseInt(page, 10) || 1);
  const parsedLimit = Math.min(MAX_LIMIT, Math.max(1, parseInt(limit, 10) || DEFAULT_LIMIT));
  const skip = (parsedPage - 1) * parsedLimit;

  const [reviews, total] = await Promise.all([
    Review.find({ fabric: fabricId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parsedLimit)
      .lean(),
    Review.countDocuments({ fabric: fabricId }),
  ]);

  return {
    reviews,
    total,
    page: parsedPage,
    pages: Math.ceil(total / parsedLimit) || 0,
  };
}

/**
 * Returns all reviews written by a specific user.
 *
 * @param {string} userId   MongoDB ObjectId string
 * @param {{ page?: number, limit?: number }} params
 * @returns {Promise<{ reviews: object[], total: number, page: number, pages: number }>}
 */
async function getReviewsByUser(userId, { page, limit } = {}) {
  const parsedPage = Math.max(1, parseInt(page, 10) || 1);
  const parsedLimit = Math.min(MAX_LIMIT, Math.max(1, parseInt(limit, 10) || DEFAULT_LIMIT));
  const skip = (parsedPage - 1) * parsedLimit;

  const [reviews, total] = await Promise.all([
    Review.find({ user: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parsedLimit)
      .populate('fabric', 'name thumbnailUrl')
      .lean(),
    Review.countDocuments({ user: userId }),
  ]);

  return {
    reviews,
    total,
    page: parsedPage,
    pages: Math.ceil(total / parsedLimit) || 0,
  };
}

/**
 * Soft-deletes (hard-removes) a review. Only the review author or an admin may delete.
 *
 * @param {string} reviewId  MongoDB ObjectId string
 * @param {string} userId    Authenticated user's ObjectId string
 * @param {string} role      'user' | 'admin'
 * @returns {Promise<void>}
 */
async function deleteReview(reviewId, userId, role) {
  const review = await Review.findById(reviewId);
  if (!review) {
    const err = new Error('Review not found');
    err.status = 404;
    throw err;
  }

  const isOwner = review.user && review.user.toString() === userId.toString();
  const isAdmin = role === 'admin';

  if (!isOwner && !isAdmin) {
    const err = new Error('You are not authorised to delete this review');
    err.status = 403;
    throw err;
  }

  await review.deleteOne();
}

/**
 * Increments the helpfulVotes counter on a review, ensuring each user votes only once.
 *
 * @param {string} reviewId  MongoDB ObjectId string
 * @param {string} userId    Authenticated user's ObjectId string
 * @returns {Promise<{ helpfulVotes: number }>}
 */
async function markHelpful(reviewId, userId) {
  const review = await Review.findById(reviewId).select('+helpfulVoters');
  if (!review) {
    const err = new Error('Review not found');
    err.status = 404;
    throw err;
  }

  const alreadyVoted = review.helpfulVoters.some((id) => id.toString() === userId.toString());
  if (alreadyVoted) {
    const err = new Error('You have already marked this review as helpful');
    err.status = 409;
    throw err;
  }

  review.helpfulVoters.push(userId);
  review.helpfulVotes += 1;
  await review.save();

  return { helpfulVotes: review.helpfulVotes };
}

module.exports = { createReview, getReviewsByFabric, getReviewsByUser, deleteReview, markHelpful };
