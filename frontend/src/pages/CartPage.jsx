import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useCartStore, { SHIPPING_RATES, TAX_RATE_US } from '../store/cartStore';
import useSuitStore from '../store/suitStore';
import { validatePromo } from '../services/cart.service';

function CartPage() {
  const {
    items,
    removeItem,
    updateQuantity,
    promoCode,
    applyPromo,
    removePromo,
    shippingRegion,
    setShippingRegion,
    getSubtotal,
    getDiscount,
    getShipping,
    getTax,
    getOrderTotal,
  } = useCartStore();

  const [promoInput, setPromoInput] = useState('');
  const [promoError, setPromoError] = useState('');
  const [promoLoading, setPromoLoading] = useState(false);

  const subtotal = getSubtotal();
  const discount = getDiscount();
  const shipping = getShipping();
  const tax = getTax();
  const orderTotal = getOrderTotal();

  async function handleApplyPromo() {
    if (!promoInput.trim()) { return; }
    setPromoError('');
    setPromoLoading(true);
    try {
      const res = await validatePromo(promoInput.trim(), subtotal);
      const result = res?.data?.data ?? res?.data ?? res;
      if (result.isValid) {
        applyPromo({
          code: promoInput.trim().toUpperCase(),
          discountType: result.discountType,
          discountValue: result.discountValue,
        });
        setPromoInput('');
      } else {
        setPromoError('This promo code is invalid or has expired');
      }
    } catch {
      setPromoError('This promo code is invalid or has expired');
    } finally {
      setPromoLoading(false);
    }
  }

  if (items.length === 0) {
    return (
      <main className="max-w-2xl mx-auto px-4 py-16 text-center">
        <h1 className="text-3xl font-serif font-bold text-gray-900 mb-4">Your Cart</h1>
        <p className="text-gray-500 mb-8">Your cart is empty.</p>
        <Link
          to="/fabrics"
          className="inline-block px-8 py-3 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 transition-colors"
        >
          Start Shopping
        </Link>
      </main>
    );
  }

  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-serif font-bold text-gray-900 mb-8">Your Cart</h1>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Left: item list */}
        <section aria-label="Cart items" className="flex-1 min-w-0">
          <ul className="space-y-4">
            {items.map((item) => (
              <CartItem
                key={item.cartItemId}
                item={item}
                onRemove={removeItem}
                onQuantityChange={updateQuantity}
              />
            ))}
          </ul>
        </section>

        {/* Right: order summary */}
        <aside className="w-full lg:w-80 flex-shrink-0">
          {/* Promo code */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-4">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Promo Code</h2>

            {promoCode ? (
              <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                <span className="text-sm font-medium text-green-800">
                  {promoCode.code} applied
                </span>
                <button
                  type="button"
                  onClick={removePromo}
                  className="text-xs text-red-500 hover:underline ml-2"
                >
                  Remove
                </button>
              </div>
            ) : (
              <>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={promoInput}
                    onChange={(e) => setPromoInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { handleApplyPromo(); } }}
                    placeholder="Enter promo code"
                    aria-label="Promo code"
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                  <button
                    type="button"
                    onClick={handleApplyPromo}
                    disabled={promoLoading || !promoInput.trim()}
                    className="px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    {promoLoading ? '…' : 'Apply'}
                  </button>
                </div>
                {promoError && (
                  <p role="alert" className="mt-2 text-xs text-red-600">
                    {promoError}
                  </p>
                )}
              </>
            )}
          </div>

          {/* Shipping region */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-4">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Shipping Region</h2>
            <div className="flex gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="shippingRegion"
                  value="us"
                  checked={shippingRegion === 'us'}
                  onChange={() => setShippingRegion('us')}
                  className="accent-brand-600"
                />
                <span className="text-sm">United States (${SHIPPING_RATES.us})</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="shippingRegion"
                  value="international"
                  checked={shippingRegion === 'international'}
                  onChange={() => setShippingRegion('international')}
                  className="accent-brand-600"
                />
                <span className="text-sm">International (${SHIPPING_RATES.international})</span>
              </label>
            </div>
          </div>

          {/* Order summary */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Order Summary</h2>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>£{subtotal.toLocaleString()}</span>
              </div>

              <div className="flex justify-between text-gray-600">
                <span>Shipping</span>
                <span>${shipping}</span>
              </div>

              {shippingRegion === 'us' && (
                <div className="flex justify-between text-gray-600">
                  <span>Tax ({(TAX_RATE_US * 100).toFixed(0)}%)</span>
                  <span>£{tax.toFixed(2)}</span>
                </div>
              )}

              {discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount ({promoCode?.code})</span>
                  <span>-£{discount.toFixed(2)}</span>
                </div>
              )}
            </div>

            <div className="border-t border-gray-200 mt-4 pt-4 flex justify-between font-semibold text-gray-900">
              <span>Total</span>
              <span>£{orderTotal.toFixed(2)}</span>
            </div>

            <Link
              to="/checkout"
              className="block w-full mt-4 py-3 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 transition-colors text-center"
            >
              Proceed to Checkout
            </Link>

            <Link
              to="/fabrics"
              className="block text-center mt-3 text-sm text-gray-500 hover:text-gray-900"
            >
              Continue Shopping
            </Link>
          </div>
        </aside>
      </div>
    </main>
  );
}

function CartItem({ item, onRemove, onQuantityChange }) {
  const navigate = useNavigate();

  const summary = [
    item.suitConfig?.style?.breasting && `${item.suitConfig.style.breasting}-breasted`,
    item.suitConfig?.lapel?.style,
    item.suitConfig?.lining?.color,
  ]
    .filter(Boolean)
    .join(' · ');

  function handleEditConfig() {
    useSuitStore.getState().loadConfig(item.suitConfig);
    navigate('/builder');
  }

  return (
    <li className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
      <div className="flex gap-4">
        {/* Swatch */}
        <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
          {item.fabricSwatchUrl ? (
            <img
              src={item.fabricSwatchUrl}
              alt={item.fabricName}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-3xl">🧵</div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-semibold text-gray-900">{item.fabricName || 'Custom Suit'}</h3>
              {summary && (
                <p className="text-sm text-gray-500 mt-0.5 capitalize">{summary}</p>
              )}
            </div>
            <p className="text-base font-bold text-gray-900 flex-shrink-0">
              £{(item.unitPrice * item.quantity).toLocaleString()}
            </p>
          </div>

          <div className="flex items-center gap-4 mt-3 flex-wrap">
            {/* Qty controls */}
            <div className="flex items-center border border-gray-200 rounded-lg text-sm">
              <button
                type="button"
                onClick={() => onQuantityChange(item.cartItemId, item.quantity - 1)}
                aria-label="Decrease quantity"
                className="px-3 py-1.5 text-gray-600 hover:bg-gray-50 rounded-l-lg"
              >
                −
              </button>
              <span className="px-4 py-1.5 border-x border-gray-200">{item.quantity}</span>
              <button
                type="button"
                onClick={() => onQuantityChange(item.cartItemId, item.quantity + 1)}
                aria-label="Increase quantity"
                className="px-3 py-1.5 text-gray-600 hover:bg-gray-50 rounded-r-lg"
              >
                +
              </button>
            </div>

            <button
              type="button"
              onClick={handleEditConfig}
              className="text-sm text-brand-600 hover:underline"
            >
              View/Edit Configuration
            </button>

            <button
              type="button"
              onClick={() => onRemove(item.cartItemId)}
              className="text-sm text-red-500 hover:underline ml-auto"
            >
              Remove
            </button>
          </div>
        </div>
      </div>
    </li>
  );
}

export default CartPage;
