'use strict';

const express = require('express');
const promoController = require('../controllers/promo.controller');

const router = express.Router();

// Public endpoint — no auth required so guests can validate promo codes too
router.post('/validate', promoController.validatePromo);

module.exports = router;
