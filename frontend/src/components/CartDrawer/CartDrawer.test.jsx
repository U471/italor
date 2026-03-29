import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

jest.mock('../../store/cartStore', () => ({ __esModule: true, default: jest.fn() }));
jest.mock('../../store/suitStore', () => ({
  __esModule: true,
  default: { getState: jest.fn().mockReturnValue({ loadConfig: jest.fn() }) },
}));

import useCartStore from '../../store/cartStore';
import useSuitStore from '../../store/suitStore';
import CartDrawer from './CartDrawer';

const MOCK_ITEM = {
  cartItemId: 'abc-1',
  suitConfig: {
    fabric: { _id: 'f1', name: 'Wool' },
    style: { breasting: 'single', buttons: 2 },
    lapel: { style: 'notch' },
    lining: { color: 'navy' },
  },
  fabricId: 'f1',
  fabricName: 'Merino Wool',
  fabricSwatchUrl: null,
  unitPrice: 300,
  quantity: 1,
  addedAt: new Date().toISOString(),
};

function renderDrawer(overrides = {}) {
  const closeDrawer = jest.fn();
  const removeItem = jest.fn();
  const updateQuantity = jest.fn();
  useCartStore.mockReturnValue({
    items: [],
    isOpen: true,
    closeDrawer,
    removeItem,
    updateQuantity,
    ...overrides,
  });
  render(
    <MemoryRouter>
      <CartDrawer />
    </MemoryRouter>
  );
  return { closeDrawer, removeItem, updateQuantity };
}

beforeEach(() => {
  jest.clearAllMocks();
  useSuitStore.getState.mockReturnValue({ loadConfig: jest.fn() });
});

describe('CartDrawer', () => {
  it('renders nothing when isOpen is false', () => {
    useCartStore.mockReturnValue({ items: [], isOpen: false, closeDrawer: jest.fn() });
    render(
      <MemoryRouter>
        <CartDrawer />
      </MemoryRouter>
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders the drawer dialog when isOpen is true', () => {
    renderDrawer();
    expect(screen.getByRole('dialog', { name: /shopping cart/i })).toBeInTheDocument();
  });

  it('shows empty cart message when items array is empty', () => {
    renderDrawer();
    expect(screen.getByText(/your cart is empty/i)).toBeInTheDocument();
  });

  it('renders cart items when present', () => {
    renderDrawer({ items: [MOCK_ITEM] });
    expect(screen.getByText('Merino Wool')).toBeInTheDocument();
    // £300 appears as both item line total and subtotal
    expect(screen.getAllByText('£300').length).toBeGreaterThan(0);
  });

  it('shows style/lapel/lining summary for a cart item', () => {
    renderDrawer({ items: [MOCK_ITEM] });
    expect(screen.getByText(/single-breasted · notch · navy/i)).toBeInTheDocument();
  });

  it('calls closeDrawer when close button is clicked', async () => {
    const user = userEvent.setup();
    const { closeDrawer } = renderDrawer();
    await user.click(screen.getByRole('button', { name: /close cart/i }));
    expect(closeDrawer).toHaveBeenCalled();
  });

  it('calls closeDrawer when backdrop is clicked', async () => {
    const user = userEvent.setup();
    const { closeDrawer } = renderDrawer();
    await user.click(document.querySelector('[aria-hidden="true"]'));
    expect(closeDrawer).toHaveBeenCalled();
  });

  it('calls removeItem when Remove button is clicked', async () => {
    const user = userEvent.setup();
    const { removeItem } = renderDrawer({ items: [MOCK_ITEM] });
    await user.click(screen.getByRole('button', { name: /remove/i }));
    expect(removeItem).toHaveBeenCalledWith('abc-1');
  });

  it('calls updateQuantity with incremented value when + is clicked', async () => {
    const user = userEvent.setup();
    const { updateQuantity } = renderDrawer({ items: [MOCK_ITEM] });
    await user.click(screen.getByRole('button', { name: /increase quantity/i }));
    expect(updateQuantity).toHaveBeenCalledWith('abc-1', 2);
  });

  it('calls updateQuantity with decremented value when − is clicked', async () => {
    const user = userEvent.setup();
    const { updateQuantity } = renderDrawer({ items: [MOCK_ITEM] });
    await user.click(screen.getByRole('button', { name: /decrease quantity/i }));
    expect(updateQuantity).toHaveBeenCalledWith('abc-1', 0);
  });

  it('calls loadConfig and closeDrawer when View/Edit Configuration is clicked', async () => {
    const user = userEvent.setup();
    const loadConfig = jest.fn();
    useSuitStore.getState.mockReturnValue({ loadConfig });
    const { closeDrawer } = renderDrawer({ items: [MOCK_ITEM] });
    await user.click(screen.getByRole('button', { name: /view\/edit configuration/i }));
    expect(loadConfig).toHaveBeenCalledWith(MOCK_ITEM.suitConfig);
    expect(closeDrawer).toHaveBeenCalled();
  });

  it('shows subtotal when items are present', () => {
    renderDrawer({ items: [{ ...MOCK_ITEM, quantity: 2 }] });
    // £600 appears as both item line total (300×2) and subtotal
    expect(screen.getAllByText('£600').length).toBeGreaterThan(0);
  });

  it('shows Proceed to Checkout button as disabled', () => {
    renderDrawer({ items: [MOCK_ITEM] });
    expect(screen.getByRole('button', { name: /proceed to checkout/i })).toBeDisabled();
  });

  it('shows item count in drawer heading', () => {
    renderDrawer({ items: [MOCK_ITEM] });
    expect(screen.getByRole('heading', { name: /shopping cart \(1\)/i })).toBeInTheDocument();
  });
});
