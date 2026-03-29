import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useCartStore, { SHIPPING_RATES, TAX_RATE_US } from '../store/cartStore';
import { createOrder } from '../services/api';

const COUNTRIES = [
  'United Kingdom',
  'United States',
  'Canada',
  'Australia',
  'France',
  'Germany',
  'Italy',
  'Spain',
  'Netherlands',
  'Switzerland',
  'Japan',
  'Singapore',
  'UAE',
  'Other',
];

const EMPTY_ADDRESS = {
  fullName: '',
  line1: '',
  line2: '',
  city: '',
  state: '',
  postalCode: '',
  country: 'United Kingdom',
  phone: '',
};

/**
 * Validates the shipping address form fields.
 *
 * @param {object} address
 * @returns {{ [field: string]: string }} Map of field -> error message
 */
function validateAddress(address) {
  const errors = {};
  if (!address.fullName.trim()) errors.fullName = 'Full name is required';
  if (!address.line1.trim()) errors.line1 = 'Address line 1 is required';
  if (!address.city.trim()) errors.city = 'City is required';
  if (!address.postalCode.trim()) errors.postalCode = 'Postal code is required';
  if (!address.country.trim()) errors.country = 'Country is required';
  return errors;
}

/**
 * Multi-step checkout page.
 *
 * Step 1 — Shipping address form
 * Step 2 — Order review + place order
 */
function CheckoutPage() {
  const navigate = useNavigate();
  const {
    items,
    promoCode,
    shippingRegion,
    getSubtotal,
    getDiscount,
    getShipping,
    getTax,
    getOrderTotal,
    clearCart,
  } = useCartStore();

  const [step, setStep] = useState(1);
  const [address, setAddress] = useState(EMPTY_ADDRESS);
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const subtotal = getSubtotal();
  const discount = getDiscount();
  const shipping = getShipping();
  const tax = getTax();
  const total = getOrderTotal();

  if (items.length === 0) {
    return (
      <main className="max-w-2xl mx-auto px-4 py-16 text-center">
        <h1 className="text-3xl font-serif font-bold text-gray-900 mb-4">Checkout</h1>
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

  /** Handle address field change and clear the individual field error. */
  function handleAddressChange(e) {
    const { name, value } = e.target;
    setAddress((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
  }

  /** Validate address and advance to review step. */
  function handleContinueToReview(e) {
    e.preventDefault();
    const errors = validateAddress(address);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    setStep(2);
  }

  /** Place order — POST to backend. */
  async function handlePlaceOrder() {
    setSubmitting(true);
    setSubmitError('');
    try {
      const result = await createOrder({
        shippingAddress: address,
        shippingRegion,
        promoCode: promoCode?.code || null,
      });
      const order = result?.data?.order ?? result?.order ?? result;
      clearCart();
      navigate(`/orders/${order._id}/confirmation`, {
        state: { order },
        replace: true,
      });
    } catch (err) {
      setSubmitError(
        err?.message || 'Failed to place your order. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-serif font-bold text-gray-900 mb-2">Checkout</h1>

      {/* Step indicator */}
      <StepIndicator currentStep={step} />

      <div className="flex flex-col lg:flex-row gap-8 items-start mt-8">
        {/* Left panel */}
        <div className="flex-1 min-w-0">
          {step === 1 && (
            <ShippingForm
              address={address}
              fieldErrors={fieldErrors}
              onChange={handleAddressChange}
              onSubmit={handleContinueToReview}
            />
          )}

          {step === 2 && (
            <ReviewStep
              address={address}
              items={items}
              onBack={() => setStep(1)}
              onPlaceOrder={handlePlaceOrder}
              submitting={submitting}
              submitError={submitError}
            />
          )}
        </div>

        {/* Right: order summary */}
        <aside className="w-full lg:w-80 flex-shrink-0">
          <OrderSummary
            items={items}
            subtotal={subtotal}
            discount={discount}
            shipping={shipping}
            tax={tax}
            total={total}
            promoCode={promoCode}
            shippingRegion={shippingRegion}
          />
        </aside>
      </div>
    </main>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

/**
 * Two-step breadcrumb indicator.
 *
 * @param {{ currentStep: number }} props
 */
function StepIndicator({ currentStep }) {
  const steps = ['Shipping Address', 'Review & Pay'];
  return (
    <nav aria-label="Checkout steps" className="flex items-center gap-0 mt-4">
      {steps.map((label, idx) => {
        const num = idx + 1;
        const active = num === currentStep;
        const done = num < currentStep;
        return (
          <div key={label} className="flex items-center">
            <div className="flex items-center gap-2">
              <span
                className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-colors
                  ${done ? 'bg-green-600 border-green-600 text-white' : ''}
                  ${active ? 'bg-brand-600 border-brand-600 text-white' : ''}
                  ${!done && !active ? 'border-gray-300 text-gray-400' : ''}
                `}
              >
                {done ? '✓' : num}
              </span>
              <span
                className={`text-sm font-medium ${active ? 'text-gray-900' : 'text-gray-400'}`}
              >
                {label}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div className="w-12 h-px bg-gray-300 mx-3" />
            )}
          </div>
        );
      })}
    </nav>
  );
}

/**
 * Shipping address form.
 */
function ShippingForm({ address, fieldErrors, onChange, onSubmit }) {
  return (
    <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-6">Shipping Address</h2>
      <form onSubmit={onSubmit} noValidate>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Full name — spans full width */}
          <div className="sm:col-span-2">
            <FormField
              label="Full Name"
              name="fullName"
              value={address.fullName}
              onChange={onChange}
              error={fieldErrors.fullName}
              required
              autoComplete="name"
            />
          </div>

          {/* Address line 1 — spans full width */}
          <div className="sm:col-span-2">
            <FormField
              label="Address Line 1"
              name="line1"
              value={address.line1}
              onChange={onChange}
              error={fieldErrors.line1}
              required
              autoComplete="address-line1"
              placeholder="Street address, P.O. box"
            />
          </div>

          {/* Address line 2 — spans full width */}
          <div className="sm:col-span-2">
            <FormField
              label="Address Line 2 (optional)"
              name="line2"
              value={address.line2}
              onChange={onChange}
              autoComplete="address-line2"
              placeholder="Apartment, suite, unit, building, floor"
            />
          </div>

          <FormField
            label="City"
            name="city"
            value={address.city}
            onChange={onChange}
            error={fieldErrors.city}
            required
            autoComplete="address-level2"
          />

          <FormField
            label="State / Province (optional)"
            name="state"
            value={address.state}
            onChange={onChange}
            autoComplete="address-level1"
          />

          <FormField
            label="Postal Code"
            name="postalCode"
            value={address.postalCode}
            onChange={onChange}
            error={fieldErrors.postalCode}
            required
            autoComplete="postal-code"
          />

          {/* Country select */}
          <div>
            <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
              Country <span className="text-red-500">*</span>
            </label>
            <select
              id="country"
              name="country"
              value={address.country}
              onChange={onChange}
              autoComplete="country-name"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
            >
              {COUNTRIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            {fieldErrors.country && (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.country}</p>
            )}
          </div>

          {/* Phone — spans full width */}
          <div className="sm:col-span-2">
            <FormField
              label="Phone (optional)"
              name="phone"
              type="tel"
              value={address.phone}
              onChange={onChange}
              autoComplete="tel"
              placeholder="+44 7000 000000"
            />
          </div>
        </div>

        <div className="mt-6">
          <button
            type="submit"
            className="w-full py-3 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 transition-colors"
          >
            Continue to Review
          </button>
        </div>
      </form>
    </section>
  );
}

/**
 * Generic labelled text input.
 */
function FormField({
  label,
  name,
  type = 'text',
  value,
  onChange,
  error,
  required,
  autoComplete,
  placeholder,
}) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        required={required}
        autoComplete={autoComplete}
        placeholder={placeholder}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error ? `${name}-error` : undefined}
        className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 transition-colors
          ${error
            ? 'border-red-400 focus:ring-red-400'
            : 'border-gray-300 focus:ring-brand-500'
          }`}
      />
      {error && (
        <p id={`${name}-error`} role="alert" className="mt-1 text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

/**
 * Order review step — shows address, items, and place-order button.
 */
function ReviewStep({ address, items, onBack, onPlaceOrder, submitting, submitError }) {
  return (
    <section className="space-y-6">
      {/* Shipping address summary */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Shipping Address</h2>
          <button
            type="button"
            onClick={onBack}
            className="text-sm text-brand-600 hover:underline"
          >
            Edit
          </button>
        </div>
        <address className="not-italic text-sm text-gray-700 space-y-0.5">
          <p className="font-medium">{address.fullName}</p>
          <p>{address.line1}</p>
          {address.line2 && <p>{address.line2}</p>}
          <p>
            {address.city}
            {address.state ? `, ${address.state}` : ''}
            {address.postalCode ? ` ${address.postalCode}` : ''}
          </p>
          <p>{address.country}</p>
          {address.phone && <p>{address.phone}</p>}
        </address>
      </div>

      {/* Items list */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Items ({items.length})
        </h2>
        <ul className="divide-y divide-gray-100">
          {items.map((item) => (
            <li key={item.cartItemId} className="flex gap-4 py-3 first:pt-0 last:pb-0">
              <div className="w-14 h-14 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                {item.fabricSwatchUrl ? (
                  <img
                    src={item.fabricSwatchUrl}
                    alt={item.fabricName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl">
                    🧵
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 text-sm">
                  {item.fabricName || 'Custom Suit'}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">Qty: {item.quantity}</p>
              </div>
              <p className="font-semibold text-gray-900 text-sm">
                £{(item.unitPrice * item.quantity).toLocaleString()}
              </p>
            </li>
          ))}
        </ul>
      </div>

      {/* Place order */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <p className="text-xs text-gray-500 mb-4">
          By placing your order you agree to our{' '}
          <a href="/terms" className="underline hover:text-gray-900">
            Terms &amp; Conditions
          </a>{' '}
          and{' '}
          <a href="/privacy" className="underline hover:text-gray-900">
            Privacy Policy
          </a>
          .
        </p>

        {submitError && (
          <p role="alert" className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
            {submitError}
          </p>
        )}

        <button
          type="button"
          onClick={onPlaceOrder}
          disabled={submitting}
          className="w-full py-3 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {submitting ? 'Placing Order…' : 'Place Order'}
        </button>

        <button
          type="button"
          onClick={onBack}
          className="w-full mt-3 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
        >
          Back to Shipping
        </button>
      </div>
    </section>
  );
}

/**
 * Right-rail order summary card.
 */
function OrderSummary({
  items,
  subtotal,
  discount,
  shipping,
  tax,
  total,
  promoCode,
  shippingRegion,
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-base font-semibold text-gray-900 mb-4">
        Order Summary ({items.length} {items.length === 1 ? 'item' : 'items'})
      </h2>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between text-gray-600">
          <span>Subtotal</span>
          <span>£{subtotal.toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-gray-600">
          <span>Shipping ({shippingRegion === 'us' ? 'US' : 'International'})</span>
          <span>${shipping}</span>
        </div>
        {shippingRegion === 'us' && tax > 0 && (
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
        <span>£{total.toFixed(2)}</span>
      </div>

      {/* Shipping rates note */}
      <p className="mt-4 text-xs text-gray-400">
        Shipping: US ${SHIPPING_RATES.us} · International ${SHIPPING_RATES.international}
      </p>
    </div>
  );
}

export default CheckoutPage;
