import { useEffect, useState } from 'react';
import { Link, useParams, useLocation } from 'react-router-dom';
import { getOrder } from '../services/api';

/**
 * Order confirmation page shown after successful payment.
 *
 * Attempts to load the order from router state first (fast path — no extra
 * network request). Falls back to fetching from the API if the user navigates
 * directly to this URL.
 *
 * Route: /orders/:orderId/confirmation
 */
function OrderConfirmationPage() {
  const { orderId } = useParams();
  const location = useLocation();

  const [order, setOrder] = useState(location.state?.order ?? null);
  const [loading, setLoading] = useState(!order);
  const [error, setError] = useState('');

  useEffect(() => {
    if (order) return;
    setLoading(true);
    getOrder(orderId)
      .then((result) => {
        setOrder(result?.data?.order ?? result?.order ?? result);
      })
      .catch((err) => {
        setError(err?.message || 'Could not load order details.');
      })
      .finally(() => setLoading(false));
  }, [orderId, order]);

  if (loading) {
    return (
      <main className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="flex justify-center">
          <svg className="animate-spin h-8 w-8 text-gray-400" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
        <p className="mt-4 text-gray-500">Loading your order…</p>
      </main>
    );
  }

  if (error || !order) {
    return (
      <main className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-red-600 mb-6">{error || 'Order not found.'}</p>
        <Link to="/account/orders" className="text-brand-600 hover:underline">
          View my orders
        </Link>
      </main>
    );
  }

  const estimatedDelivery = new Date(
    new Date(order.createdAt || Date.now()).getTime() + 35 * 24 * 60 * 60 * 1000
  );
  const deliveryStr = estimatedDelivery.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <main className="max-w-2xl mx-auto px-4 py-12">
      {/* Success header */}
      <div className="text-center mb-10">
        <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-3xl font-serif font-bold text-gray-900">Order Confirmed!</h1>
        <p className="mt-2 text-gray-500">
          Thank you for your purchase. A confirmation email has been sent to you.
        </p>
      </div>

      {/* Order reference card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Order Number</p>
            <p className="text-xl font-bold text-gray-900 font-mono">{order.orderNumber}</p>
          </div>
          <StatusBadge status={order.status} />
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-600 mt-2">
          <svg className="w-4 h-4 text-green-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span>Estimated delivery by <strong>{deliveryStr}</strong></span>
        </div>
      </div>

      {/* Items */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">
          Items Ordered ({order.items?.length ?? 0})
        </h2>
        <ul className="divide-y divide-gray-100">
          {(order.items || []).map((item, idx) => (
            <li key={item.cartItemId ?? idx} className="flex gap-4 py-3 first:pt-0 last:pb-0">
              <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                {item.fabricSwatchUrl ? (
                  <img src={item.fabricSwatchUrl} alt={item.fabricName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xl">🧵</div>
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
      </div>

      {/* Shipping address */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-base font-semibold text-gray-900 mb-3">Shipping To</h2>
        {order.shippingAddress && (
          <address className="not-italic text-sm text-gray-700 space-y-0.5">
            <p className="font-medium">{order.shippingAddress.fullName}</p>
            <p>{order.shippingAddress.line1}</p>
            {order.shippingAddress.line2 && <p>{order.shippingAddress.line2}</p>}
            <p>
              {order.shippingAddress.city}
              {order.shippingAddress.state ? `, ${order.shippingAddress.state}` : ''}
              {order.shippingAddress.postalCode ? ` ${order.shippingAddress.postalCode}` : ''}
            </p>
            <p>{order.shippingAddress.country}</p>
          </address>
        )}
      </div>

      {/* Price breakdown */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Payment Summary</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-gray-600">
            <span>Subtotal</span>
            <span>£{order.subtotal?.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Shipping</span>
            <span>£{order.shippingCost?.toFixed(2)}</span>
          </div>
          {order.taxAmount > 0 && (
            <div className="flex justify-between text-gray-600">
              <span>Tax</span>
              <span>£{order.taxAmount?.toFixed(2)}</span>
            </div>
          )}
          {order.discountAmount > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Discount{order.promoCode ? ` (${order.promoCode})` : ''}</span>
              <span>-£{order.discountAmount?.toFixed(2)}</span>
            </div>
          )}
        </div>
        <div className="border-t border-gray-200 mt-4 pt-4 flex justify-between font-bold text-gray-900">
          <span>Total Paid</span>
          <span>£{order.total?.toFixed(2)}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          to="/account/orders"
          className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors text-center"
        >
          View My Orders
        </Link>
        <Link
          to="/fabrics"
          className="flex-1 py-3 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 transition-colors text-center"
        >
          Continue Shopping
        </Link>
      </div>
    </main>
  );
}

/**
 * Status badge for order status display.
 *
 * @param {{ status: string }} props
 */
function StatusBadge({ status }) {
  const styles = {
    pending_payment: 'bg-yellow-100 text-yellow-800',
    payment_failed: 'bg-red-100 text-red-800',
    confirmed: 'bg-blue-100 text-blue-800',
    in_production: 'bg-indigo-100 text-indigo-800',
    quality_check: 'bg-orange-100 text-orange-800',
    shipped: 'bg-purple-100 text-purple-800',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
    refunded: 'bg-gray-100 text-gray-800',
  };

  const labels = {
    pending_payment: 'Pending Payment',
    payment_failed: 'Payment Failed',
    confirmed: 'Confirmed',
    in_production: 'In Production',
    quality_check: 'Quality Check',
    shipped: 'Shipped',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
    refunded: 'Refunded',
  };

  const cls = styles[status] ?? 'bg-gray-100 text-gray-800';
  const label = labels[status] ?? status;

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${cls}`}>
      {label}
    </span>
  );
}

export default OrderConfirmationPage;
