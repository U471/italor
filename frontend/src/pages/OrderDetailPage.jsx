import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { getOrderDetail } from '../services/api';

/**
 * Status-to-timeline-step mapping.
 * Timeline steps in display order.
 */
const TIMELINE_STEPS = [
  {
    key: 'confirmed',
    label: 'Order Confirmed',
    description: 'Your order has been received and payment confirmed.',
    matchStatuses: ['confirmed'],
  },
  {
    key: 'in_production',
    label: 'In Tailoring',
    description: 'Your suit is being crafted by our master tailors.',
    matchStatuses: ['in_production'],
  },
  {
    key: 'quality_check',
    label: 'Quality Check',
    description: 'Final inspection to ensure perfect fit and finish.',
    matchStatuses: ['quality_check'],
  },
  {
    key: 'shipped',
    label: 'Shipped',
    description: 'Your order is on its way to you.',
    matchStatuses: ['shipped'],
  },
  {
    key: 'delivered',
    label: 'Delivered',
    description: 'Your suit has been delivered.',
    matchStatuses: ['delivered'],
  },
];

/**
 * Returns the index of the current status within the timeline (0-based).
 * Returns -1 for statuses that don't appear in the timeline
 * (e.g. pending_payment, payment_failed, cancelled, refunded).
 */
function timelineIndex(status) {
  for (let i = 0; i < TIMELINE_STEPS.length; i++) {
    if (TIMELINE_STEPS[i].matchStatuses.includes(status)) return i;
  }
  return -1;
}

const STATUS_LABELS = {
  pending_payment: 'Pending Payment',
  payment_failed: 'Payment Failed',
  confirmed: 'Confirmed',
  in_production: 'In Tailoring',
  quality_check: 'Quality Check',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
};

const STATUS_STYLES = {
  pending_payment: 'bg-yellow-100 text-yellow-800',
  payment_failed: 'bg-red-100 text-red-800',
  confirmed: 'bg-blue-100 text-blue-800',
  in_production: 'bg-indigo-100 text-indigo-800',
  quality_check: 'bg-orange-100 text-orange-800',
  shipped: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-700',
  refunded: 'bg-gray-100 text-gray-700',
};

/**
 * Known carrier tracking URL patterns.
 * Expand as needed.
 */
const CARRIER_TRACKING_URLS = {
  ups: (trackingNumber) => `https://www.ups.com/track?tracknum=${trackingNumber}`,
  fedex: (trackingNumber) => `https://www.fedex.com/fedextrack/?trknbr=${trackingNumber}`,
  dhl: (trackingNumber) => `https://www.dhl.com/en/express/tracking.html?AWB=${trackingNumber}`,
  usps: (trackingNumber) => `https://tools.usps.com/go/TrackConfirmAction?tLabels=${trackingNumber}`,
  royalmail: (trackingNumber) => `https://www.royalmail.com/track-your-item#/tracking-results/${trackingNumber}`,
};

/**
 * Builds a carrier tracking URL from carrier name and tracking number.
 *
 * @param {string} carrier
 * @param {string} trackingNumber
 * @returns {string|null}
 */
function buildTrackingUrl(carrier, trackingNumber) {
  if (!carrier || !trackingNumber) return null;
  const key = carrier.toLowerCase().replace(/\s+/g, '');
  const builder = CARRIER_TRACKING_URLS[key];
  return builder ? builder(trackingNumber) : null;
}

/**
 * StatusBadge component.
 *
 * @param {{ status: string }} props
 */
function StatusBadge({ status }) {
  const cls = STATUS_STYLES[status] ?? 'bg-gray-100 text-gray-700';
  const label = STATUS_LABELS[status] ?? status;
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${cls}`}>
      {label}
    </span>
  );
}

/**
 * Renders the 5-step status timeline.
 * Steps completed before the current are shown as checked/green.
 * The current step is highlighted.
 * Future steps are grey.
 *
 * @param {{ order: object }} props
 */
function StatusTimeline({ order }) {
  const currentIndex = timelineIndex(order.status);

  // Build a map of status → timestamp from statusHistory for completed steps.
  const timestampMap = {};
  if (Array.isArray(order.statusHistory)) {
    for (const event of order.statusHistory) {
      // Keep earliest occurrence for each status
      if (!timestampMap[event.status]) {
        timestampMap[event.status] = event.timestamp;
      }
    }
  }

  // For non-timeline statuses show a simple banner instead.
  if (currentIndex === -1) {
    const isCancelled = order.status === 'cancelled' || order.status === 'refunded';
    return (
      <div className={`rounded-xl p-4 mb-6 ${isCancelled ? 'bg-red-50 border border-red-200' : 'bg-yellow-50 border border-yellow-200'}`}>
        <p className={`text-sm font-medium ${isCancelled ? 'text-red-700' : 'text-yellow-700'}`}>
          {isCancelled
            ? `This order has been ${STATUS_LABELS[order.status]?.toLowerCase()}.`
            : 'Awaiting payment confirmation. The timeline will appear once your payment is processed.'}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-6">Order Progress</h2>
      <ol className="relative">
        {TIMELINE_STEPS.map((step, idx) => {
          const isCompleted = idx < currentIndex;
          const isCurrent = idx === currentIndex;
          const isFuture = idx > currentIndex;

          // Find timestamp from history for any matching status
          let timestamp = null;
          for (const s of step.matchStatuses) {
            if (timestampMap[s]) {
              timestamp = timestampMap[s];
              break;
            }
          }

          return (
            <li key={step.key} className="flex gap-4 pb-6 last:pb-0">
              {/* Connector line + circle */}
              <div className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border-2 transition-colors
                    ${isCompleted ? 'bg-green-500 border-green-500' : ''}
                    ${isCurrent ? 'bg-brand-600 border-brand-600' : ''}
                    ${isFuture ? 'bg-white border-gray-300' : ''}
                  `}
                >
                  {isCompleted && (
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3} aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  {isCurrent && (
                    <span className="w-3 h-3 rounded-full bg-white block" />
                  )}
                  {isFuture && (
                    <span className="w-2.5 h-2.5 rounded-full bg-gray-300 block" />
                  )}
                </div>
                {idx < TIMELINE_STEPS.length - 1 && (
                  <div className={`w-0.5 flex-1 mt-1 ${isCompleted ? 'bg-green-400' : 'bg-gray-200'}`} />
                )}
              </div>

              {/* Step content */}
              <div className="pt-1 pb-2">
                <p className={`text-sm font-semibold ${isFuture ? 'text-gray-400' : 'text-gray-900'}`}>
                  {step.label}
                </p>
                {(isCompleted || isCurrent) && (
                  <p className="text-xs text-gray-500 mt-0.5">{step.description}</p>
                )}
                {timestamp && (
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(timestamp).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/**
 * Tracking info section shown for shipped orders.
 *
 * @param {{ order: object }} props
 */
function TrackingInfo({ order }) {
  if (order.status !== 'shipped' && order.status !== 'delivered') return null;
  if (!order.trackingNumber) return null;

  const trackingUrl = buildTrackingUrl(order.carrier, order.trackingNumber);

  return (
    <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 mb-6">
      <h3 className="text-sm font-semibold text-purple-800 mb-2">Tracking Information</h3>
      <div className="space-y-1">
        {order.carrier && (
          <p className="text-sm text-purple-700">
            <span className="font-medium">Carrier:</span> {order.carrier}
          </p>
        )}
        <p className="text-sm text-purple-700">
          <span className="font-medium">Tracking Number:</span>{' '}
          <span className="font-mono">{order.trackingNumber}</span>
        </p>
        {trackingUrl && (
          <a
            href={trackingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm font-medium text-purple-600 hover:underline mt-1"
          >
            Track your shipment
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        )}
      </div>
    </div>
  );
}

/**
 * Order items list.
 *
 * @param {{ items: Array }} props
 */
function OrderItemsList({ items }) {
  if (!items?.length) return null;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-6">
      <div className="px-6 py-4 border-b border-gray-100">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
          Order Items ({items.length})
        </h2>
      </div>
      <ul className="divide-y divide-gray-100">
        {items.map((item, idx) => (
          <li key={item.cartItemId || idx} className="flex gap-4 px-6 py-4">
            {item.fabricSwatchUrl ? (
              <img
                src={item.fabricSwatchUrl}
                alt={item.fabricName}
                className="w-16 h-16 object-cover rounded-lg flex-shrink-0 border border-gray-200"
              />
            ) : (
              <div className="w-16 h-16 bg-gray-100 rounded-lg flex-shrink-0 flex items-center justify-center">
                <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                </svg>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{item.fabricName || 'Custom Suit'}</p>
              {item.suitConfig && (
                <SuitConfigSummary config={item.suitConfig} />
              )}
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                <p className="text-sm font-semibold text-gray-900">£{(item.unitPrice * item.quantity).toFixed(2)}</p>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Compact suit configuration summary.
 *
 * @param {{ config: object }} props
 */
function SuitConfigSummary({ config }) {
  const details = [];
  if (config.style) details.push(`Style: ${config.style}`);
  if (config.lapel) details.push(`Lapel: ${config.lapel}`);
  if (config.fit) details.push(`Fit: ${config.fit}`);
  if (!details.length) return null;
  return (
    <p className="text-xs text-gray-500 mt-0.5 truncate">{details.join(' · ')}</p>
  );
}

/**
 * Shipping address block.
 *
 * @param {{ address: object }} props
 */
function ShippingAddressBlock({ address }) {
  if (!address) return null;
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Shipping Address</h2>
      <address className="not-italic text-sm text-gray-700 leading-relaxed">
        <p className="font-semibold">{address.fullName}</p>
        <p>{address.line1}</p>
        {address.line2 && <p>{address.line2}</p>}
        <p>{[address.city, address.state, address.postalCode].filter(Boolean).join(', ')}</p>
        <p>{address.country}</p>
        {address.phone && <p className="mt-1 text-gray-500">{address.phone}</p>}
      </address>
    </div>
  );
}

/**
 * Price breakdown table.
 *
 * @param {{ order: object }} props
 */
function PriceBreakdown({ order }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Price Breakdown</h2>
      <dl className="space-y-2 text-sm">
        <div className="flex justify-between">
          <dt className="text-gray-600">Subtotal</dt>
          <dd className="font-medium text-gray-900">£{order.subtotal?.toFixed(2)}</dd>
        </div>
        {order.discountAmount > 0 && (
          <div className="flex justify-between text-green-600">
            <dt>
              Discount
              {order.promoCode && (
                <span className="ml-1 font-mono text-xs bg-green-100 px-1 rounded">{order.promoCode}</span>
              )}
            </dt>
            <dd>- £{order.discountAmount?.toFixed(2)}</dd>
          </div>
        )}
        <div className="flex justify-between">
          <dt className="text-gray-600">Shipping</dt>
          <dd className="font-medium text-gray-900">
            {order.shippingCost === 0 ? 'Free' : `£${order.shippingCost?.toFixed(2)}`}
          </dd>
        </div>
        {order.taxAmount > 0 && (
          <div className="flex justify-between">
            <dt className="text-gray-600">Tax</dt>
            <dd className="font-medium text-gray-900">£{order.taxAmount?.toFixed(2)}</dd>
          </div>
        )}
        <div className="flex justify-between pt-3 border-t border-gray-200 text-base font-bold">
          <dt className="text-gray-900">Total</dt>
          <dd className="text-gray-900">£{order.total?.toFixed(2)}</dd>
        </div>
      </dl>
    </div>
  );
}

/**
 * Order Detail page.
 * Route: /account/orders/:orderId
 *
 * Shows full order details including: status timeline, tracking info (when shipped),
 * items list, shipping address, and price breakdown.
 */
function OrderDetailPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadOrder() {
      setLoading(true);
      setError('');
      try {
        const result = await getOrderDetail(orderId);
        const data = result?.data ?? result;
        if (!cancelled) {
          setOrder(data.order ?? data);
        }
      } catch (err) {
        if (!cancelled) {
          if (err?.status === 404) {
            setError('Order not found. It may belong to a different account.');
          } else {
            setError(err?.message || 'Failed to load order details.');
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadOrder();
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  if (loading) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-16 flex justify-center">
        <svg className="animate-spin h-8 w-8 text-gray-400" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </main>
    );
  }

  if (error) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-16 text-center">
        <div role="alert" className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-6">
          {error}
        </div>
        <button
          type="button"
          onClick={() => navigate('/account/orders')}
          className="text-sm font-medium text-brand-600 hover:underline"
        >
          Back to My Orders
        </button>
      </main>
    );
  }

  if (!order) return null;

  const dateStr = new Date(order.createdAt).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      {/* Back link */}
      <Link
        to="/account/orders"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Back to My Orders
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-serif font-bold text-gray-900">
            Order{' '}
            <span className="font-mono text-xl">{order.orderNumber}</span>
          </h1>
          <p className="text-sm text-gray-500 mt-1">Placed on {dateStr}</p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      {/* Status timeline */}
      <StatusTimeline order={order} />

      {/* Tracking info (shipped / delivered only) */}
      <TrackingInfo order={order} />

      {/* Items */}
      <OrderItemsList items={order.items} />

      {/* Shipping + Price side-by-side on md+ */}
      <div className="md:grid md:grid-cols-2 md:gap-6">
        <ShippingAddressBlock address={order.shippingAddress} />
        <PriceBreakdown order={order} />
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3 mt-2">
        <Link
          to="/account/orders"
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          All Orders
        </Link>
        {order.status === 'delivered' && order.items?.[0]?.fabricId && (
          <Link
            to={`/account/orders/${order._id}/review`}
            className="px-4 py-2 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700 transition-colors"
          >
            Write a Review
          </Link>
        )}
        <Link
          to="/fabrics"
          className="px-4 py-2 text-sm font-medium text-brand-600 border border-brand-600 rounded-lg hover:bg-brand-50 transition-colors"
        >
          Shop Again
        </Link>
      </div>
    </main>
  );
}

export default OrderDetailPage;
