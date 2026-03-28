'use strict';

const mongoose = require('mongoose');

const fabricSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Fabric name is required'],
      trim: true,
      maxlength: [200, 'Name cannot exceed 200 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
      default: '',
    },
    material: {
      type: String,
      required: [true, 'Material is required'],
      trim: true,
      lowercase: true,
      enum: ['wool', 'cotton', 'linen', 'silk', 'polyester', 'cashmere', 'blend'],
    },
    color: {
      type: String,
      required: [true, 'Color is required'],
      trim: true,
      lowercase: true,
    },
    pattern: {
      type: String,
      required: [true, 'Pattern is required'],
      trim: true,
      lowercase: true,
      enum: ['solid', 'striped', 'checked', 'herringbone', 'plaid', 'houndstooth', 'pinstripe'],
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    imageUrl: {
      type: String,
      default: null,
    },
    thumbnailUrl: {
      type: String,
      default: null,
    },
    stock: {
      type: Number,
      default: 0,
      min: 0,
    },
    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    origin: {
      type: String,
      trim: true,
      default: null,
    },
    weight: {
      // grams per square meter
      type: Number,
      default: null,
    },
    tags: {
      type: [String],
      default: [],
    },
    images: {
      type: [String],
      default: [],
    },
    season: {
      type: String,
      trim: true,
      lowercase: true,
      enum: ['all-year', 'summer', 'winter', 'spring-autumn'],
      default: 'all-year',
    },
    careInstructions: {
      type: String,
      trim: true,
      maxlength: [500, 'Care instructions cannot exceed 500 characters'],
      default: '',
    },
    patternDescription: {
      type: String,
      trim: true,
      maxlength: [500, 'Pattern description cannot exceed 500 characters'],
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Text index for full-text search on name, description, material, color, tags
fabricSchema.index({ name: 'text', description: 'text', tags: 'text' });

// Regular indexes for filter fields
fabricSchema.index({ material: 1 });
fabricSchema.index({ color: 1 });
fabricSchema.index({ pattern: 1 });
fabricSchema.index({ price: 1 });
fabricSchema.index({ isActive: 1 });

const Fabric = mongoose.model('Fabric', fabricSchema);

module.exports = Fabric;
