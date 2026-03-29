import api from './api';

export function getCart() {
  return api.get('/api/v1/cart');
}

export function addCartItem(item) {
  return api.post('/api/v1/cart/items', item);
}

export function updateCartItem(cartItemId, quantity) {
  return api.put(`/api/v1/cart/items/${cartItemId}`, { quantity });
}

export function removeCartItem(cartItemId) {
  return api.delete(`/api/v1/cart/items/${cartItemId}`);
}

export function mergeCart(items) {
  return api.post('/api/v1/cart/merge', { items });
}

export function validatePromo(code, cartTotal) {
  return api.post('/api/v1/promo/validate', { code, cartTotal });
}
