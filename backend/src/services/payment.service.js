'use strict';

const Order = require('../models/Order');
const Cart = require('../models/Cart');

/**
 * Lazily initialise the Stripe client so the module can be loaded in test
 * environments without a real STRIPE_SECRET_KEY env var set.
 * Tests mock this module directly so stripe is never called.
 *
 * @returns {import('stripe').Stripe}
 */
function getStripe() {
  // eslint-disable-next-line global-require
  return require('stripe')(process.env.STRIPE_SECRET_KEY);
}

/**
 * Creates a Stripe PaymentIntent for a pending order.
 * Stores the PaymentIntent ID on the order document for idempotency.
 * If the order already has a PaymentIntent in a reusable state,
 * returns the existing client secret rather than creating a new one.
 *
 * @param {string} orderId
 * @param {string} userId
 * @returns {Promise<{ clientSecret: string, paymentIntentId: string }>}
 */
async function createPaymentIntent(orderId, userId) {
  const stripe = getStripe();
  const order = await Order.findOne({ _id: orderId, user: userId });

  if (!order) {
    const err = new Error('Order not found');
    err.status = 404;
    throw err;
  }

  if (order.status !== 'pending_payment') {
    const err = new Error(`Order cannot be paid in its current status: ${order.status}`);
    err.status = 400;
    throw err;
  }

  // Re-use an existing PaymentIntent if possible (idempotency on page refresh)
  if (order.paymentIntentId) {
    const existing = await stripe.paymentIntents.retrieve(order.paymentIntentId);
    if (['requires_payment_method', 'requires_confirmation', 'requires_action'].includes(existing.status)) {
      return { clientSecret: existing.client_secret, paymentIntentId: existing.id };
    }
  }

  // Amount in smallest currency unit (pence for GBP)
  const amountInPence = Math.round(order.total * 100);

  const paymentIntent = await stripe.paymentIntents.create({
    amount: amountInPence,
    currency: 'gbp',
    automatic_payment_methods: { enabled: true },
    metadata: {
      orderId: order._id.toString(),
      userId: userId.toString(),
      orderNumber: order.orderNumber,
    },
  });

  // Persist the PaymentIntent ID on the order so the webhook can look it up
  order.paymentIntentId = paymentIntent.id;
  await order.save();

  return { clientSecret: paymentIntent.client_secret, paymentIntentId: paymentIntent.id };
}

/**
 * Handles the payment_intent.succeeded webhook event.
 * Transitions order to 'confirmed', records payment method and timestamp,
 * and clears the user's cart.
 *
 * @param {object} paymentIntent - Stripe PaymentIntent object from webhook event
 * @returns {Promise<object>} Updated order document
 */
async function handlePaymentSucceeded(paymentIntent) {
  const orderId = paymentIntent.metadata?.orderId;

  if (!orderId) {
    throw new Error(`PaymentIntent ${paymentIntent.id} has no orderId in metadata`);
  }

  const order = await Order.findById(orderId);

  if (!order) {
    throw new Error(`Order ${orderId} not found for PaymentIntent ${paymentIntent.id}`);
  }

  // Idempotent: if already confirmed, skip
  if (order.status === 'confirmed') {
    return order;
  }

  order.status = 'confirmed';
  order.paymentMethod = paymentIntent.payment_method_types?.[0] ?? 'card';
  order.paidAt = new Date();
  await order.save();

  // Clear the user's cart
  await Cart.findOneAndUpdate({ user: order.user }, { $set: { items: [] } });

  return order;
}

/**
 * Handles the payment_intent.payment_failed webhook event.
 * Transitions order status to 'payment_failed'.
 *
 * @param {object} paymentIntent - Stripe PaymentIntent object from webhook event
 * @returns {Promise<object>} Updated order document
 */
async function handlePaymentFailed(paymentIntent) {
  const orderId = paymentIntent.metadata?.orderId;
  if (!orderId) return null;

  const order = await Order.findById(orderId);
  if (!order) return null;

  // Only mark as failed if currently pending
  if (order.status === 'pending_payment') {
    order.status = 'payment_failed';
    await order.save();
  }

  return order;
}

module.exports = {
  createPaymentIntent,
  handlePaymentSucceeded,
  handlePaymentFailed,
};
