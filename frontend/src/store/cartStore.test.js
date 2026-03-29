import useCartStore from './cartStore';

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
  useCartStore.setState({ items: [], isOpen: false });
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
});
