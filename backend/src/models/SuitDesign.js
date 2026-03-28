'use strict';

const mongoose = require('mongoose');

/**
 * SuitDesign — persisted configurator state.
 * Populated step-by-step as the user progresses through the builder.
 * Guest designs (no user) use a sessionId for retrieval.
 */
const suitDesignSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    sessionId: { type: String, default: null },

    fabric: { type: mongoose.Schema.Types.ObjectId, ref: 'Fabric', default: null },
    fabricSnapshot: {
      name: { type: String },
      material: { type: String },
      color: { type: String },
      price: { type: Number },
      thumbnailUrl: { type: String },
    },

    style: {
      breasting: { type: String, enum: ['single', 'double'], default: null },
      buttons: { type: Number, min: 1, max: 4, default: null },
    },

    lapel: {
      style: { type: String, enum: ['notch', 'peak', 'shawl'], default: null },
      width: { type: String, enum: ['narrow', 'standard', 'wide'], default: null },
    },

    lining: {
      color: { type: String, default: null },
      pattern: { type: String, enum: ['solid', 'striped', 'dotted', 'paisley'], default: null },
    },

    details: {
      pocketStyle: { type: String, enum: ['flap', 'jetted', 'patch'], default: null },
      ventStyle: { type: String, enum: ['no-vent', 'single', 'double'], default: null },
      sleeveButtons: { type: Number, min: 1, max: 5, default: null },
    },

    monogram: {
      text: { type: String, maxlength: 5, default: null },
      position: { type: String, enum: ['chest', 'cuff', 'none'], default: null },
      font: { type: String, enum: ['serif', 'script', 'block'], default: null },
    },

    status: {
      type: String,
      enum: ['draft', 'saved', 'ordered'],
      default: 'draft',
    },
  },
  { timestamps: true }
);

suitDesignSchema.index({ user: 1, createdAt: -1 });
suitDesignSchema.index({ sessionId: 1 });

module.exports = mongoose.model('SuitDesign', suitDesignSchema);
