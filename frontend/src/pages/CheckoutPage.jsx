import { useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import useCartStore, { SHIPPING_RATES, TAX_RATE_US } from '../store/cartStore';
import { createOrder, createPaymentIntent } from '../services/api';

// Initialise Stripe outside of render — singleton pattern required by Stripe docs
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

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
 * Three-step checkout page.
 *
 * Step 1 — Shipping address form
 * Step 2 — Order review (confirm items, address, totals, estimated delivery)
 * Step 3 — Stripe Payment Element (card input, pay button)
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

  // Order created at end of Step 2 — needed for PaymentIntent
  const [pendingOrder, setPendingOrder] = useState(null);
  const [clientSecret, setClientSecret] = useState('');
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [createOrderError, setCreateOrderError] = useState('');

  const subtotal = getSubtotal();
  const discount = getDiscount();
  const shipping = getShipping();
  const tax = getTax();
  const total = getOrderTotal();

  if (items.length === 0 && !pendingOrder) {
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

  /** Handle address field change and clear individual field error. */
  function handleAddressChange(e) {
    const { name, value } = e.target;
    setAddress((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
  }

  /** Validate and advance from Step 1 to Step 2. */
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

  /**
   * Creates the pending order and fetches the Stripe clientSecret,
   * then advances to Step 3 (payment).
   */
  async function handleProceedToPayment() {
    setCreatingOrder(true);
    setCreateOrderError('');
    try {
      // Step A: create the pending order in our backend
      const orderResult = await createOrder({
        shippingAddress: address,
        shippingRegion,
        promoCode: promoCode?.code || null,
      });
      const order = orderResult?.data?.order ?? orderResult?.order ?? orderResult;
      setPendingOrder(order);

      // Step B: create a Stripe PaymentIntent for that order
      const intentResult = await createPaymentIntent(order._id);
      const secret = intentResult?.data?.clientSecret ?? intentResult?.clientSecret;
      setClientSecret(secret);

      setStep(3);
    } catch (err) {
      setCreateOrderError(
        err?.message || 'Failed to initialise payment. Please try again.'
      );
    } finally {
      setCreatingOrder(false);
    }
  }

  /** Called by the Stripe payment form on successful payment. */
  const handlePaymentSuccess = useCallback(() => {
    clearCart();
    navigate(`/orders/${pendingOrder._id}/confirmation`, {
      state: { order: pendingOrder },
      replace: true,
    });
  }, [clearCart, navigate, pendingOrder]);

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
              total={total}
              onBack={() => setStep(1)}
              onProceedToPayment={handleProceedToPayment}
              submitting={creatingOrder}
              submitError={createOrderError}
            />
          )}

          {step === 3 && clientSecret && (
            <Elements
              stripe={stripePromise}
              options={{
                clientSecret,
                appearance: {
                  theme: 'stripe',
                  variables: { colorPrimary: '#1d4ed8', borderRadius: '8px' },
                },
              }}
            >
              <PaymentStep
                order={pendingOrder}
                total={total}
                onBack={() => setStep(2)}
                onSuccess={handlePaymentSuccess}
              />
            </Elements>
          )}

          {step === 3 && !clientSecret && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 text-center">
              <p className="text-gray-500">Initialising payment…</p>
            </div>
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
 * Three-step breadcrumb indicator.
 *
 * @param {{ currentStep: number }} props
 */
function StepIndicator({ currentStep }) {
  const steps = ['Shipping Address', 'Review Order', 'Payment'];
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
 * Shipping address form — Step 1.
 */
function ShippingForm({ address, fieldErrors, onChange, onSubmit }) {
  return (
    <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-6">Shipping Address</h2>
      <form onSubmit={onSubmit} noValidate>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
function FormField({ label, name, type = 'text', value, onChange, error, required, autoComplete, placeholder }) {
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
          ${error ? 'border-red-400 focus:ring-red-400' : 'border-gray-300 focus:ring-brand-500'}`}
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
 * Order review step — Step 2.
 * Shows address summary, items list, estimated delivery, and Proceed to Payment button.
 */
function ReviewStep({ address, items, total, onBack, onProceedToPayment, submitting, submitError }) {
  const estimatedDelivery = new Date(Date.now() + 35 * 24 * 60 * 60 * 1000);
  const deliveryStr = estimatedDelivery.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <section className="space-y-6">
      {/* Shipping address summary */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Shipping Address</h2>
          <button type="button" onClick={onBack} className="text-sm text-brand-600 hover:underline">
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
                  <img src={item.fabricSwatchUrl} alt={item.fabricName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl">🧵</div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 text-sm">{item.fabricName || 'Custom Suit'}</p>
                <p className="text-xs text-gray-500 mt-0.5">Qty: {item.quantity}</p>
              </div>
              <p className="font-semibold text-gray-900 text-sm">
                £{(item.unitPrice * item.quantity).toLocaleString()}
              </p>
            </li>
          ))}
        </ul>

        {/* Estimated delivery */}
        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-2 text-sm text-gray-600">
          <svg className="w-4 h-4 text-green-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span>Estimated delivery by <strong>{deliveryStr}</strong></span>
        </div>
      </div>

      {/* Proceed to payment */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <p className="text-xs text-gray-500 mb-4">
          By placing your order you agree to our{' '}
          <a href="/terms" className="underline hover:text-gray-900">Terms &amp; Conditions</a>{' '}
          and{' '}
          <a href="/privacy" className="underline hover:text-gray-900">Privacy Policy</a>.
        </p>

        {submitError && (
          <p role="alert" className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
            {submitError}
          </p>
        )}

        <button
          type="button"
          onClick={onProceedToPayment}
          disabled={submitting}
          className="w-full py-3 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {submitting ? 'Preparing Payment…' : `Proceed to Payment — £${total.toFixed(2)}`}
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
 * Payment step — Step 3.
 * Renders the Stripe Payment Element inside an Elements provider.
 * Must be used as a child of <Elements> so useStripe/useElements hooks are available.
 *
 * @param {{ order: object, total: number, onBack: function, onSuccess: function }} props
 */
function PaymentStep({ order, total, onBack, onSuccess }) {
  const stripe = useStripe();
  const elements = useElements();

  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState('');

  /**
   * Confirms the payment with Stripe.
   * On success, calls onSuccess to navigate to the confirmation page.
   */
  async function handlePay(e) {
    e.preventDefault();
    if (!stripe || !elements) return;

    setPayError('');
    setPaying(true);

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        redirect: 'if_required',
      });

      if (error) {
        // Show Stripe's decline message verbatim for card errors; generic message otherwise
        if (error.type === 'card_error' || error.type === 'validation_error') {
          setPayError(error.message || 'Your card was declined. Please try another payment method.');
        } else {
          setPayError('An unexpected payment error occurred. Please try again.');
        }
      } else {
        // Payment succeeded — webhook will confirm the order asynchronously
        onSuccess();
      }
    } catch (err) {
      setPayError(err?.message || 'Payment failed. Please try again.');
    } finally {
      setPaying(false);
    }
  }

  return (
    <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-6">Payment Details</h2>

      <form onSubmit={handlePay} noValidate>
        {/* Stripe Payment Element — renders card number, expiry, CVC securely */}
        <PaymentElement
          options={{
            layout: 'tabs',
          }}
        />

        {payError && (
          <p role="alert" className="mt-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
            {payError}
          </p>
        )}

        <div className="mt-6 space-y-3">
          <button
            type="submit"
            disabled={paying || !stripe}
            className="w-full py-3 bg-brand-600 text-white rounded-lg font-semibold hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {paying ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Processing…
              </span>
            ) : (
              `Pay £${total.toFixed(2)}`
            )}
          </button>

          <button
            type="button"
            onClick={onBack}
            className="w-full py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
          >
            Back to Review
          </button>
        </div>

        {/* Stripe trust badge */}
        <p className="mt-4 text-xs text-center text-gray-400">
          Secured by{' '}
          <a
            href="https://stripe.com"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium hover:underline"
          >
            Stripe
          </a>
        </p>
      </form>
    </section>
  );
}

/**
 * Right-rail order summary card.
 */
function OrderSummary({ items, subtotal, discount, shipping, tax, total, promoCode, shippingRegion }) {
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
          <span>£{shipping}</span>
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

      <p className="mt-4 text-xs text-gray-400">
        Shipping: US £{SHIPPING_RATES.us} · International £{SHIPPING_RATES.international}
      </p>
    </div>
  );
}

export default CheckoutPage;
