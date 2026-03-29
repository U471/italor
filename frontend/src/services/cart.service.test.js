jest.mock('./api', () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
}));

import api from './api';
import {
  getCart,
  addCartItem,
  updateCartItem,
  removeCartItem,
  mergeCart,
  validatePromo,
} from './cart.service';

beforeEach(() => jest.clearAllMocks());

describe('cart.service', () => {
  it('getCart calls api.get with correct path', () => {
    getCart();
    expect(api.get).toHaveBeenCalledWith('/api/v1/cart');
  });

  it('addCartItem calls api.post with correct path and payload', () => {
    const item = { cartItemId: 'abc', quantity: 1 };
    addCartItem(item);
    expect(api.post).toHaveBeenCalledWith('/api/v1/cart/items', item);
  });

  it('updateCartItem calls api.put with correct path and payload', () => {
    updateCartItem('abc-123', 3);
    expect(api.put).toHaveBeenCalledWith('/api/v1/cart/items/abc-123', { quantity: 3 });
  });

  it('removeCartItem calls api.delete with correct path', () => {
    removeCartItem('abc-123');
    expect(api.delete).toHaveBeenCalledWith('/api/v1/cart/items/abc-123');
  });

  it('mergeCart calls api.post with correct path and items', () => {
    const items = [{ cartItemId: 'x', quantity: 1 }];
    mergeCart(items);
    expect(api.post).toHaveBeenCalledWith('/api/v1/cart/merge', { items });
  });

  it('validatePromo calls api.post with correct path and payload', () => {
    validatePromo('SUIT20', 500);
    expect(api.post).toHaveBeenCalledWith('/api/v1/promo/validate', {
      code: 'SUIT20',
      cartTotal: 500,
    });
  });
});
