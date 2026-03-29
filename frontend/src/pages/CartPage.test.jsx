import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

jest.mock('../store/cartStore', () => ({
  __esModule: true,
  default: jest.fn(),
  SHIPPING_RATES: { us: 15, international: 45 },
  TAX_RATE_US: 0.08,
}));
jest.mock('../store/suitStore', () => ({
  __esModule: true,
  default: { getState: jest.fn().mockReturnValue({ loadConfig: jest.fn() }) },
}));
jest.mock('../services/cart.service', () => ({
  validatePromo: jest.fn(),
}));

import useCartStore from '../store/cartStore';
import useSuitStore from '../store/suitStore';
import { validatePromo } from '../services/cart.service';
import CartPage from './CartPage';

const MOCK_ITEM = {
  cartItemId: 'abc-1',
  suitConfig: {
    fabric: { _id: 'f1' },
    style: { breasting: 'single' },
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

const removeItem = jest.fn();
const updateQuantity = jest.fn();
const applyPromo = jest.fn();
const removePromo = jest.fn();
const setShippingRegion = jest.fn();

function makeCartState(overrides = {}) {
  return {
    items: [MOCK_ITEM],
    isOpen: false,
    promoCode: null,
    shippingRegion: 'international',
    removeItem,
    updateQuantity,
    applyPromo,
    removePromo,
    setShippingRegion,
    getSubtotal: () => 300,
    getDiscount: () => 0,
    getShipping: () => 45,
    getTax: () => 0,
    getOrderTotal: () => 345,
    ...overrides,
  };
}

function renderCart(stateOverrides = {}) {
  useCartStore.mockReturnValue(makeCartState(stateOverrides));
  return render(
    <MemoryRouter>
      <CartPage />
    </MemoryRouter>
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  useSuitStore.getState.mockReturnValue({ loadConfig: jest.fn() });
});

describe('CartPage', () => {
  it('shows empty cart message when no items', () => {
    useCartStore.mockReturnValue(makeCartState({
      items: [],
      getSubtotal: () => 0,
      getDiscount: () => 0,
      getShipping: () => 45,
      getTax: () => 0,
      getOrderTotal: () => 45,
    }));
    render(<MemoryRouter><CartPage /></MemoryRouter>);
    expect(screen.getByText(/your cart is empty/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /start shopping/i })).toBeInTheDocument();
  });

  it('renders cart items', () => {
    renderCart();
    expect(screen.getByText('Merino Wool')).toBeInTheDocument();
    expect(screen.getByText('single-breasted · notch · navy')).toBeInTheDocument();
  });

  it('renders order summary with subtotal and shipping', () => {
    renderCart();
    expect(screen.getByText('Order Summary')).toBeInTheDocument();
    // £300 appears as both item line total and subtotal
    expect(screen.getAllByText('£300').length).toBeGreaterThan(0);
    expect(screen.getByText('$45')).toBeInTheDocument();
  });

  it('shows Proceed to Checkout button as disabled', () => {
    renderCart();
    expect(screen.getByRole('button', { name: /proceed to checkout/i })).toBeDisabled();
  });

  it('calls removeItem when Remove is clicked', async () => {
    const user = userEvent.setup();
    renderCart();
    await user.click(screen.getByRole('button', { name: /remove/i }));
    expect(removeItem).toHaveBeenCalledWith('abc-1');
  });

  it('calls updateQuantity when + is clicked', async () => {
    const user = userEvent.setup();
    renderCart();
    await user.click(screen.getByRole('button', { name: /increase quantity/i }));
    expect(updateQuantity).toHaveBeenCalledWith('abc-1', 2);
  });

  it('calls updateQuantity when − is clicked', async () => {
    const user = userEvent.setup();
    renderCart();
    await user.click(screen.getByRole('button', { name: /decrease quantity/i }));
    expect(updateQuantity).toHaveBeenCalledWith('abc-1', 0);
  });

  it('calls loadConfig and navigates when View/Edit Configuration is clicked', async () => {
    const loadConfig = jest.fn();
    useSuitStore.getState.mockReturnValue({ loadConfig });
    const user = userEvent.setup();
    renderCart();
    await user.click(screen.getByRole('button', { name: /view\/edit configuration/i }));
    expect(loadConfig).toHaveBeenCalledWith(MOCK_ITEM.suitConfig);
  });

  it('applies promo code on successful validation', async () => {
    validatePromo.mockResolvedValue({
      data: { data: { isValid: true, discountType: 'percentage', discountValue: 20 } },
    });
    const user = userEvent.setup();
    renderCart();
    await user.type(screen.getByRole('textbox', { name: /promo code/i }), 'SUIT20');
    await user.click(screen.getByRole('button', { name: /apply/i }));
    await waitFor(() => expect(applyPromo).toHaveBeenCalledWith({
      code: 'SUIT20',
      discountType: 'percentage',
      discountValue: 20,
    }));
  });

  it('shows error for invalid promo code', async () => {
    validatePromo.mockResolvedValue({ data: { data: { isValid: false } } });
    const user = userEvent.setup();
    renderCart();
    await user.type(screen.getByRole('textbox', { name: /promo code/i }), 'BADCODE');
    await user.click(screen.getByRole('button', { name: /apply/i }));
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(
        'This promo code is invalid or has expired'
      )
    );
  });

  it('shows error when validatePromo throws', async () => {
    validatePromo.mockRejectedValue(new Error('Network error'));
    const user = userEvent.setup();
    renderCart();
    await user.type(screen.getByRole('textbox', { name: /promo code/i }), 'SUIT20');
    await user.click(screen.getByRole('button', { name: /apply/i }));
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(
        'This promo code is invalid or has expired'
      )
    );
  });

  it('shows applied promo code when promoCode is set', () => {
    renderCart({
      promoCode: { code: 'SUIT20', discountType: 'percentage', discountValue: 20 },
      getDiscount: () => 60,
      getOrderTotal: () => 285,
    });
    expect(screen.getByText(/SUIT20 applied/i)).toBeInTheDocument();
  });

  it('calls removePromo when promo Remove is clicked', async () => {
    const user = userEvent.setup();
    renderCart({
      promoCode: { code: 'SUIT20', discountType: 'percentage', discountValue: 20 },
      getDiscount: () => 60,
      getOrderTotal: () => 285,
    });
    // Scope to the aside (order summary panel) to avoid ambiguity with item Remove
    const aside = screen.getByRole('complementary');
    await user.click(within(aside).getByRole('button', { name: /remove/i }));
    expect(removePromo).toHaveBeenCalled();
  });

  it('calls setShippingRegion when US radio is selected', async () => {
    const user = userEvent.setup();
    renderCart();
    await user.click(screen.getByRole('radio', { name: /united states/i }));
    expect(setShippingRegion).toHaveBeenCalledWith('us');
  });

  it('shows discount line item when discount > 0', () => {
    renderCart({
      promoCode: { code: 'SUIT20', discountType: 'percentage', discountValue: 20 },
      getDiscount: () => 60,
      getOrderTotal: () => 285,
    });
    expect(screen.getByText(/-£60.00/)).toBeInTheDocument();
  });

  it('shows tax line item for US orders', () => {
    renderCart({
      shippingRegion: 'us',
      getShipping: () => 15,
      getTax: () => 24,
      getOrderTotal: () => 339,
    });
    expect(screen.getByText(/tax/i)).toBeInTheDocument();
    expect(screen.getByText('£24.00')).toBeInTheDocument();
  });

  it('Apply button is disabled when input is empty', () => {
    renderCart();
    expect(screen.getByRole('button', { name: /apply/i })).toBeDisabled();
  });
});
