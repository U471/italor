'use strict';

const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    fabric: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Fabric',
      required: [true, 'Fabric reference is required'],
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    /**
     * The order this review is tied to.
     * Enforces one review per order item (unique compound index below).
     */
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      default: null,
      index: true,
    },
    displayName: {
      type: String,
      required: [true, 'Display name is required'],
      trim: true,
      maxlength: [100, 'Display name cannot exceed 100 characters'],
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5'],
    },
    fitRating: {
      type: Number,
      min: [1, 'Fit rating must be at least 1'],
      max: [5, 'Fit rating cannot exceed 5'],
      default: null,
    },
    title: {
      type: String,
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
      default: '',
    },
    body: {
      type: String,
      trim: true,
      maxlength: [2000, 'Review body cannot exceed 2000 characters'],
      default: '',
    },
    isVerifiedPurchase: {
      type: Boolean,
      default: false,
    },
    helpfulVotes: {
      type: Number,
      default: 0,
      min: 0,
    },
    /**
     * Array of user IDs who have already voted helpful on this review.
     * Used to prevent duplicate votes per user.
     */
    helpfulVoters: {
      type: [mongoose.Schema.Types.ObjectId],
      default: [],
      select: false,
    },
  },
  {
    timestamps: true,
  }
);

reviewSchema.index({ fabric: 1, createdAt: -1 });

/**
 * One review per user per order — prevent duplicate reviews on the same order item.
 * Sparse so that legacy reviews without an order field are not affected.
 */
reviewSchema.index({ user: 1, order: 1 }, { unique: true, sparse: true });

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
