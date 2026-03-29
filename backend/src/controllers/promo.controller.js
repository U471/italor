'use strict';

const promoService = require('../services/promo.service');

async function validatePromo(req, res, next) {
  try {
    const { code, cartTotal } = req.body;

    if (!code || typeof code !== 'string') {
      return res.status(400).json({ status: 'error', message: 'code is required' });
    }

    const result = await promoService.validatePromo(code, Number(cartTotal) || 0);
    return res.json({ status: 'success', data: result });
  } catch (err) {
    return next(err);
  }
}

module.exports = { validatePromo };
