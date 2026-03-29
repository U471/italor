'use strict';

jest.mock('../src/models/Cart');

const Cart = require('../src/models/Cart');
const {
  getCart,
  addItem,
  updateQuantity,
  removeItem,
  mergeGuestCart,
} = require('../src/services/cart.service');

const MOCK_USER_ID = 'user-123';
const MOCK_ITEM = {
  cartItemId: 'item-1',
  suitConfig: { fabric: { _id: 'f1' } },
  fabricId: 'f1',
  fabricName: 'Merino Wool',
  fabricSwatchUrl: null,
  unitPrice: 300,
  quantity: 1,
  addedAt: new Date().toISOString(),
};

function makeMockCart(items = []) {
  const cart = {
    user: MOCK_USER_ID,
    items: [...items],
    save: jest.fn().mockResolvedValue(undefined),
  };
  return cart;
}

beforeEach(() => jest.clearAllMocks());

describe('getCart', () => {
  it('returns existing cart', async () => {
    const cart = makeMockCart();
    Cart.findOne.mockResolvedValue(cart);
    const result = await getCart(MOCK_USER_ID);
    expect(Cart.findOne).toHaveBeenCalledWith({ user: MOCK_USER_ID });
    expect(result).toBe(cart);
  });

  it('creates a new cart if none exists', async () => {
    Cart.findOne.mockResolvedValue(null);
    const cart = makeMockCart();
    Cart.create.mockResolvedValue(cart);
    const result = await getCart(MOCK_USER_ID);
    expect(Cart.create).toHaveBeenCalledWith({ user: MOCK_USER_ID, items: [] });
    expect(result).toBe(cart);
  });
});

describe('addItem', () => {
  it('pushes item onto cart.items and saves', async () => {
    const cart = makeMockCart();
    Cart.findOne.mockResolvedValue(cart);
    const result = await addItem(MOCK_USER_ID, MOCK_ITEM);
    expect(cart.items).toHaveLength(1);
    expect(cart.save).toHaveBeenCalled();
    expect(result).toBe(cart);
  });
});

describe('updateQuantity', () => {
  it('updates item quantity and saves', async () => {
    const cart = makeMockCart([{ ...MOCK_ITEM }]);
    Cart.findOne.mockResolvedValue(cart);
    await updateQuantity(MOCK_USER_ID, 'item-1', 4);
    expect(cart.items[0].quantity).toBe(4);
    expect(cart.save).toHaveBeenCalled();
  });

  it('enforces minimum quantity of 1', async () => {
    const cart = makeMockCart([{ ...MOCK_ITEM }]);
    Cart.findOne.mockResolvedValue(cart);
    await updateQuantity(MOCK_USER_ID, 'item-1', 0);
    expect(cart.items[0].quantity).toBe(1);
  });

  it('throws 404 error when cartItemId not found', async () => {
    const cart = makeMockCart();
    Cart.findOne.mockResolvedValue(cart);
    await expect(updateQuantity(MOCK_USER_ID, 'missing', 2)).rejects.toMatchObject({
      status: 404,
      message: 'Cart item not found',
    });
  });
});

describe('removeItem', () => {
  it('removes item from cart.items and saves', async () => {
    const cart = makeMockCart([{ ...MOCK_ITEM }, { ...MOCK_ITEM, cartItemId: 'item-2' }]);
    Cart.findOne.mockResolvedValue(cart);
    await removeItem(MOCK_USER_ID, 'item-1');
    expect(cart.items).toHaveLength(1);
    expect(cart.items[0].cartItemId).toBe('item-2');
    expect(cart.save).toHaveBeenCalled();
  });

  it('saves even when item does not exist', async () => {
    const cart = makeMockCart([{ ...MOCK_ITEM }]);
    Cart.findOne.mockResolvedValue(cart);
    await removeItem(MOCK_USER_ID, 'nonexistent');
    expect(cart.items).toHaveLength(1);
    expect(cart.save).toHaveBeenCalled();
  });
});

describe('mergeGuestCart', () => {
  it('appends new guest items to empty server cart', async () => {
    const cart = makeMockCart();
    Cart.findOne.mockResolvedValue(cart);
    await mergeGuestCart(MOCK_USER_ID, [MOCK_ITEM]);
    expect(cart.items).toHaveLength(1);
    expect(cart.save).toHaveBeenCalled();
  });

  it('updates existing item when cartItemId matches (newest wins)', async () => {
    const existing = { ...MOCK_ITEM, quantity: 1 };
    const cart = makeMockCart([existing]);
    Cart.findOne.mockResolvedValue(cart);
    const guestItem = { ...MOCK_ITEM, quantity: 5, suitConfig: { fabric: null } };
    await mergeGuestCart(MOCK_USER_ID, [guestItem]);
    expect(cart.items).toHaveLength(1);
    expect(cart.items[0].quantity).toBe(5);
    expect(cart.items[0].suitConfig).toEqual({ fabric: null });
  });

  it('handles empty guestItems array', async () => {
    const cart = makeMockCart([{ ...MOCK_ITEM }]);
    Cart.findOne.mockResolvedValue(cart);
    await mergeGuestCart(MOCK_USER_ID, []);
    expect(cart.items).toHaveLength(1);
    expect(cart.save).toHaveBeenCalled();
  });
});
