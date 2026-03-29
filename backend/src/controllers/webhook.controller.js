'use strict';

const paymentService = require('../services/payment.service');
const logger = require('../utils/logger');

/**
 * Lazily get the Stripe client so this module loads without a key in test env.
 *
 * @returns {import('stripe').Stripe}
 */
function getStripe() {
  // eslint-disable-next-line global-require
  return require('stripe')(process.env.STRIPE_SECRET_KEY);
}

/**
 * POST /api/v1/webhooks/stripe
 *
 * Stripe webhook handler. Must receive the raw (unparsed) body so
 * stripe.webhooks.constructEvent can verify the signature.
 *
 * Handled events:
 *   - payment_intent.succeeded  → confirm order, clear cart
 *   - payment_intent.payment_failed → mark order payment_failed
 *
 * Always responds 200 to Stripe to prevent retries, even on internal errors.
 * Errors are logged but not re-thrown.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
async function handleStripeWebhook(req, res) {
  const stripe = getStripe();
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    logger.error(`Stripe webhook signature verification failed: ${err.message}`);
    return res.status(400).json({ error: `Webhook signature verification failed: ${err.message}` });
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const order = await paymentService.handlePaymentSucceeded(event.data.object);
        logger.info(`Order ${order?.orderNumber} confirmed via webhook`);
        break;
      }

      case 'payment_intent.payment_failed': {
        const order = await paymentService.handlePaymentFailed(event.data.object);
        logger.info(`Order ${order?.orderNumber ?? 'unknown'} marked payment_failed via webhook`);
        break;
      }

      default:
        // Unhandled event type — acknowledge and move on
        logger.info(`Unhandled Stripe event type: ${event.type}`);
    }
  } catch (err) {
    // Log but always return 200 so Stripe doesn't retry indefinitely
    logger.error(`Error processing Stripe webhook event ${event.type}: ${err.message}`, {
      stack: err.stack,
    });
  }

  return res.json({ received: true });
}

module.exports = { handleStripeWebhook };
