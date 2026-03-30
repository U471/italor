'use strict';

const { param, validationResult } = require('express-validator');
const paymentService = require('../services/payment.service');

/**
 * Validation rules for the create-intent endpoint.
 */
const createIntentRules = [
  param('orderId')
    .trim()
    .notEmpty()
    .withMessage('orderId is required')
    .isMongoId()
    .withMessage('orderId must be a valid Mongo ObjectId'),
];

/**
 * POST /api/v1/payments/:orderId/create-intent
 *
 * Creates (or retrieves) a Stripe PaymentIntent for the given pending order.
 * Returns the clientSecret needed by Stripe Elements on the frontend.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
async function createPaymentIntent(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ status: 'error', errors: errors.array() });
    }

    const { orderId } = req.params;
    const { clientSecret, paymentIntentId } = await paymentService.createPaymentIntent(
      orderId,
      req.user.userId
    );

    return res.json({
      status: 'success',
      data: { clientSecret, paymentIntentId },
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = { createPaymentIntent, createIntentRules };
