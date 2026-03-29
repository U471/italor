'use strict';

const mongoose = require('mongoose');

/**
 * Schema for a single line item within an order.
 * Mirrors the cart item shape so we capture a point-in-time snapshot.
 */
const orderItemSchema = new mongoose.Schema(
  {
    cartItemId: { type: String, required: true },
    suitConfig: { type: mongoose.Schema.Types.Mixed, required: true },
    fabricId: { type: String, default: null },
    fabricName: { type: String, default: '' },
    fabricSwatchUrl: { type: String, default: null },
    unitPrice: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1, default: 1 },
  },
  { _id: false }
);

/**
 * Shipping address sub-document.
 */
const shippingAddressSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    line1: { type: String, required: true, trim: true },
    line2: { type: String, default: '', trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, default: '', trim: true },
    postalCode: { type: String, required: true, trim: true },
    country: { type: String, required: true, trim: true },
    phone: { type: String, default: '', trim: true },
  },
  { _id: false }
);

/**
 * Order status timeline entry.
 */
const statusEventSchema = new mongoose.Schema(
  {
    status: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    note: { type: String, default: '' },
  },
  { _id: false }
);

const ORDER_STATUSES = [
  'pending_payment',
  'payment_failed',
  'confirmed',
  'in_production',
  'quality_check',
  'shipped',
  'delivered',
  'cancelled',
  'refunded',
];

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    orderNumber: {
      type: String,
      unique: true,
      required: true,
    },
    items: {
      type: [orderItemSchema],
      validate: {
        validator: (v) => Array.isArray(v) && v.length > 0,
        message: 'Order must contain at least one item',
      },
    },
    shippingAddress: {
      type: shippingAddressSchema,
      required: true,
    },
    shippingRegion: {
      type: String,
      enum: ['us', 'international'],
      required: true,
    },
    subtotal: { type: Number, required: true, min: 0 },
    discountAmount: { type: Number, default: 0, min: 0 },
    promoCode: { type: String, default: null },
    shippingCost: { type: Number, required: true, min: 0 },
    taxAmount: { type: Number, default: 0, min: 0 },
    total: { type: Number, required: true, min: 0 },

    status: {
      type: String,
      enum: ORDER_STATUSES,
      default: 'pending_payment',
      index: true,
    },
    statusHistory: {
      type: [statusEventSchema],
      default: [],
    },

    // Payment — populated after SCRUM-37 Stripe integration
    paymentIntentId: { type: String, default: null },
    paymentMethod: { type: String, default: null },
    paidAt: { type: Date, default: null },

    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

/**
 * Pre-save hook: push a status event whenever the status field changes.
 */
orderSchema.pre('save', function (next) {
  if (this.isModified('status')) {
    this.statusHistory.push({ status: this.status, timestamp: new Date() });
  }
  next();
});

/**
 * Generates a human-readable order number.
 * Format: IT-<YEAR><MONTH>-<6 random uppercase alphanum chars>
 * e.g. IT-202603-AB12CD
 *
 * @returns {string}
 */
orderSchema.statics.generateOrderNumber = function () {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let suffix = '';
  for (let i = 0; i < 6; i++) {
    suffix += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `IT-${year}${month}-${suffix}`;
};

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
