'use strict';

const mongoose = require('mongoose');

/**
 * Design — persisted user suit configuration for save/resume workflow.
 * Each document represents a named snapshot of the builder config.
 */
const designSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: { type: String, default: '' },
    suitConfig: { type: mongoose.Schema.Types.Mixed, required: true },
    previewImageUrl: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Design', designSchema);
