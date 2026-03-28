'use strict';

const mongoose = require('mongoose');

const measurementProfileSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true },
    measurements: { type: mongoose.Schema.Types.Mixed, required: true },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('MeasurementProfile', measurementProfileSchema);
