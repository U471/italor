import useCartStore, { SHIPPING_RATES, TAX_RATE_US } from './cartStore';

const MOCK_CONFIG = {
  fabric: { _id: 'f1', name: 'Merino Wool', price: 300, thumbnailUrl: null },
  style: { breasting: 'single', buttons: 2 },
  lapel: { style: 'notch' },
  lining: { color: 'navy' },
  details: null,
  monogram: null,
  measurements: null,
};

beforeEach(() => {
  useCartStore.setState({ items: [], isOpen: false, promoCode: null, shippingRegion: 'international' });
});

describe('cartStore', () => {
  it('initialises with empty items and closed drawer', () => {
    const { items, isOpen } = useCartStore.getState();
    expect(items).toHaveLength(0);
    expect(isOpen).toBe(false);
  });

  it('addItem adds an item and opens the drawer', () => {
    useCartStore.getState().addItem(MOCK_CONFIG);
    const { items, isOpen } = useCartStore.getState();
    expect(items).toHaveLength(1);
    expect(isOpen).toBe(true);
  });

  it('addItem sets correct fabric fields', () => {
    useCartStore.getState().addItem(MOCK_CONFIG);
    const item = useCartStore.getState().items[0];
    expect(item.fabricName).toBe('Merino Wool');
    expect(item.fabricId).toBe('f1');
    expect(item.unitPrice).toBe(300);
    expect(item.quantity).toBe(1);
    expect(item.cartItemId).toBeDefined();
  });

  it('addItem stores a full suitConfig snapshot', () => {
    useCartStore.getState().addItem(MOCK_CONFIG);
    const item = useCartStore.getState().items[0];
    expect(item.suitConfig.fabric._id).toBe('f1');
    expect(item.suitConfig.style.breasting).toBe('single');
  });

  it('addItem handles config with no fabric gracefully', () => {
    useCartStore.getState().addItem({ fabric: null });
    const item = useCartStore.getState().items[0];
    expect(item.fabricName).toBe('');
    expect(item.unitPrice).toBe(0);
    expect(item.fabricId).toBeNull();
  });

  it('addItem generates a unique cartItemId per item', () => {
    useCartStore.getState().addItem(MOCK_CONFIG);
    useCartStore.getState().addItem(MOCK_CONFIG);
    const [a, b] = useCartStore.getState().items;
    expect(a.cartItemId).not.toBe(b.cartItemId);
  });

  it('removeItem removes the correct item by cartItemId', () => {
    useCartStore.getState().addItem(MOCK_CONFIG);
    useCartStore.getState().addItem(MOCK_CONFIG);
    const { items } = useCartStore.getState();
    const idToRemove = items[0].cartItemId;
    useCartStore.getState().removeItem(idToRemove);
    expect(useCartStore.getState().items).toHaveLength(1);
    expect(useCartStore.getState().items[0].cartItemId).not.toBe(idToRemove);
  });

  it('updateQuantity updates the correct item', () => {
    useCartStore.getState().addItem(MOCK_CONFIG);
    const id = useCartStore.getState().items[0].cartItemId;
    useCartStore.getState().updateQuantity(id, 3);
    expect(useCartStore.getState().items[0].quantity).toBe(3);
  });

  it('updateQuantity enforces a minimum of 1', () => {
    useCartStore.getState().addItem(MOCK_CONFIG);
    const id = useCartStore.getState().items[0].cartItemId;
    useCartStore.getState().updateQuantity(id, 0);
    expect(useCartStore.getState().items[0].quantity).toBe(1);
  });

  it('openDrawer sets isOpen to true', () => {
    useCartStore.getState().openDrawer();
    expect(useCartStore.getState().isOpen).toBe(true);
  });

  it('closeDrawer sets isOpen to false', () => {
    useCartStore.setState({ isOpen: true });
    useCartStore.getState().closeDrawer();
    expect(useCartStore.getState().isOpen).toBe(false);
  });

  it('clearCart removes all items', () => {
    useCartStore.getState().addItem(MOCK_CONFIG);
    useCartStore.getState().addItem(MOCK_CONFIG);
    useCartStore.getState().clearCart();
    expect(useCartStore.getState().items).toHaveLength(0);
  });

  it('setItems replaces the entire items array', () => {
    const newItems = [{ cartItemId: 'x', quantity: 2, unitPrice: 100 }];
    useCartStore.getState().setItems(newItems);
    expect(useCartStore.getState().items).toEqual(newItems);
  });

  it('getTotal sums unitPrice × quantity for all items', () => {
    useCartStore.getState().addItem(MOCK_CONFIG);
    const id = useCartStore.getState().items[0].cartItemId;
    useCartStore.getState().updateQuantity(id, 2);
    expect(useCartStore.getState().getTotal()).toBe(600);
  });

  it('getTotal returns 0 for empty cart', () => {
    expect(useCartStore.getState().getTotal()).toBe(0);
  });

  it('getCount sums all quantities', () => {
    useCartStore.getState().addItem(MOCK_CONFIG);
    useCartStore.getState().addItem(MOCK_CONFIG);
    const [, b] = useCartStore.getState().items;
    useCartStore.getState().updateQuantity(b.cartItemId, 3);
    expect(useCartStore.getState().getCount()).toBe(4);
  });

  // ── Promo code ──────────────────────────────────────────────────────────────
  it('initialises with no promoCode', () => {
    expect(useCartStore.getState().promoCode).toBeNull();
  });

  it('applyPromo sets promoCode', () => {
    const promo = { code: 'SUIT20', discountType: 'percentage', discountValue: 20 };
    useCartStore.getState().applyPromo(promo);
    expect(useCartStore.getState().promoCode).toEqual(promo);
  });

  it('removePromo clears promoCode', () => {
    useCartStore.getState().applyPromo({ code: 'X', discountType: 'fixed', discountValue: 10 });
    useCartStore.getState().removePromo();
    expect(useCartStore.getState().promoCode).toBeNull();
  });

  it('getDiscount returns 0 with no promo', () => {
    useCartStore.getState().addItem(MOCK_CONFIG);
    expect(useCartStore.getState().getDiscount()).toBe(0);
  });

  it('getDiscount calculates percentage discount correctly', () => {
    useCartStore.getState().addItem(MOCK_CONFIG); // unitPrice 300, qty 1 → subtotal 300
    useCartStore.getState().applyPromo({ code: 'SUIT20', discountType: 'percentage', discountValue: 20 });
    expect(useCartStore.getState().getDiscount()).toBe(60); // 20% of 300
  });

  it('getDiscount calculates fixed discount correctly', () => {
    useCartStore.getState().addItem(MOCK_CONFIG); // subtotal 300
    useCartStore.getState().applyPromo({ code: 'SAVE50', discountType: 'fixed', discountValue: 50 });
    expect(useCartStore.getState().getDiscount()).toBe(50);
  });

  it('getDiscount caps fixed discount at subtotal', () => {
    useCartStore.getState().addItem(MOCK_CONFIG); // subtotal 300
    useCartStore.getState().applyPromo({ code: 'BIG', discountType: 'fixed', discountValue: 1000 });
    expect(useCartStore.getState().getDiscount()).toBe(300); // capped at subtotal
  });

  // ── Shipping ────────────────────────────────────────────────────────────────
  it('initialises with international shipping region', () => {
    expect(useCartStore.getState().shippingRegion).toBe('international');
  });

  it('setShippingRegion updates the shipping region', () => {
    useCartStore.getState().setShippingRegion('us');
    expect(useCartStore.getState().shippingRegion).toBe('us');
  });

  it('getShipping returns correct rate for international', () => {
    expect(useCartStore.getState().getShipping()).toBe(SHIPPING_RATES.international);
  });

  it('getShipping returns correct rate for US', () => {
    useCartStore.getState().setShippingRegion('us');
    expect(useCartStore.getState().getShipping()).toBe(SHIPPING_RATES.us);
  });

  // ── Tax ─────────────────────────────────────────────────────────────────────
  it('getTax returns 0 for international orders', () => {
    useCartStore.getState().addItem(MOCK_CONFIG);
    expect(useCartStore.getState().getTax()).toBe(0);
  });

  it('getTax returns 8% of subtotal for US orders', () => {
    useCartStore.getState().addItem(MOCK_CONFIG); // subtotal 300
    useCartStore.getState().setShippingRegion('us');
    expect(useCartStore.getState().getTax()).toBeCloseTo(300 * TAX_RATE_US);
  });

  // ── Order total ─────────────────────────────────────────────────────────────
  it('getOrderTotal sums subtotal + shipping (international, no promo)', () => {
    useCartStore.getState().addItem(MOCK_CONFIG); // subtotal 300
    // discount 0, shipping 45, tax 0 → total 345
    expect(useCartStore.getState().getOrderTotal()).toBe(345);
  });

  it('getOrderTotal applies discount correctly', () => {
    useCartStore.getState().addItem(MOCK_CONFIG); // subtotal 300
    useCartStore.getState().applyPromo({ code: 'SUIT20', discountType: 'percentage', discountValue: 20 });
    // 300 - 60 + 45 = 285
    expect(useCartStore.getState().getOrderTotal()).toBe(285);
  });

  it('getOrderTotal adds US shipping and tax', () => {
    useCartStore.getState().addItem(MOCK_CONFIG); // subtotal 300
    useCartStore.getState().setShippingRegion('us');
    // 300 - 0 + 15 + 24 = 339
    expect(useCartStore.getState().getOrderTotal()).toBeCloseTo(300 + 15 + 300 * TAX_RATE_US);
  });

  it('clearCart removes items and promo', () => {
    useCartStore.getState().addItem(MOCK_CONFIG);
    useCartStore.getState().applyPromo({ code: 'X', discountType: 'fixed', discountValue: 10 });
    useCartStore.getState().clearCart();
    expect(useCartStore.getState().items).toHaveLength(0);
    expect(useCartStore.getState().promoCode).toBeNull();
  });

  it('exports SHIPPING_RATES constants', () => {
    expect(SHIPPING_RATES.us).toBe(15);
    expect(SHIPPING_RATES.international).toBe(45);
  });

  it('exports TAX_RATE_US constant', () => {
    expect(TAX_RATE_US).toBe(0.08);
  });
});
