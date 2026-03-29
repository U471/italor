'use strict';

const cartService = require('../services/cart.service');

async function getCart(req, res, next) {
  try {
    const cart = await cartService.getCart(req.user.userId);
    res.json({ status: 'success', data: { cart } });
  } catch (err) {
    next(err);
  }
}

async function addItem(req, res, next) {
  try {
    const cart = await cartService.addItem(req.user.userId, req.body);
    res.status(201).json({ status: 'success', data: { cart } });
  } catch (err) {
    next(err);
  }
}

async function updateItem(req, res, next) {
  try {
    const { cartItemId } = req.params;
    const { quantity } = req.body;
    const cart = await cartService.updateQuantity(req.user.userId, cartItemId, quantity);
    res.json({ status: 'success', data: { cart } });
  } catch (err) {
    next(err);
  }
}

async function removeItem(req, res, next) {
  try {
    const { cartItemId } = req.params;
    const cart = await cartService.removeItem(req.user.userId, cartItemId);
    res.json({ status: 'success', data: { cart } });
  } catch (err) {
    next(err);
  }
}

async function mergeCart(req, res, next) {
  try {
    const { items } = req.body;
    const cart = await cartService.mergeGuestCart(req.user.userId, items || []);
    res.json({ status: 'success', data: { cart } });
  } catch (err) {
    next(err);
  }
}

module.exports = { getCart, addItem, updateItem, removeItem, mergeCart };
