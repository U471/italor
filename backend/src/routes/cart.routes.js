'use strict';

const express = require('express');
const { authenticate } = require('../middleware/auth.middleware');
const cartController = require('../controllers/cart.controller');

const router = express.Router();

router.use(authenticate);

router.get('/', cartController.getCart);
router.post('/items', cartController.addItem);
router.put('/items/:cartItemId', cartController.updateItem);
router.delete('/items/:cartItemId', cartController.removeItem);
router.post('/merge', cartController.mergeCart);

module.exports = router;
