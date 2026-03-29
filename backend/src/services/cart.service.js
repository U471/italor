'use strict';

const Cart = require('../models/Cart');

async function getCart(userId) {
  let cart = await Cart.findOne({ user: userId });
  if (!cart) {
    cart = await Cart.create({ user: userId, items: [] });
  }
  return cart;
}

async function addItem(userId, item) {
  const cart = await getCart(userId);
  cart.items.push(item);
  await cart.save();
  return cart;
}

async function updateQuantity(userId, cartItemId, quantity) {
  const cart = await getCart(userId);
  const item = cart.items.find((i) => i.cartItemId === cartItemId);
  if (!item) {
    const err = new Error('Cart item not found');
    err.status = 404;
    throw err;
  }
  item.quantity = Math.max(1, quantity);
  await cart.save();
  return cart;
}

async function removeItem(userId, cartItemId) {
  const cart = await getCart(userId);
  cart.items = cart.items.filter((i) => i.cartItemId !== cartItemId);
  await cart.save();
  return cart;
}

async function mergeGuestCart(userId, guestItems) {
  const cart = await getCart(userId);
  for (const guestItem of guestItems) {
    const existing = cart.items.find((i) => i.cartItemId === guestItem.cartItemId);
    if (existing) {
      existing.suitConfig = guestItem.suitConfig;
      existing.quantity = guestItem.quantity;
    } else {
      cart.items.push(guestItem);
    }
  }
  await cart.save();
  return cart;
}

module.exports = { getCart, addItem, updateQuantity, removeItem, mergeGuestCart };
