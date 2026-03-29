import { useState, useEffect, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { adminGetOrderDetail, adminUpdateOrderStatus, adminProcessRefund } from '../../services/api';

/**
 * State machine: maps current status to allowed next statuses.
 */
const ALLOWED_TRANSITIONS = {
  confirmed: ['in_production', 'cancelled'],
  in_production: ['quality_check', 'cancelled'],
  quality_check: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: [],
  refunded: [],
  pending_payment: ['confirmed', 'cancelled'],
  payment_failed: ['cancelled'],
};

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
 * Status badge.
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
 * Modal to update order status.
 * Shows tracking fields when 'shipped' is selected.
 *
 * @param {{ order: object, onClose: function, onSuccess: function }} props
 */
function UpdateStatusModal({ order, onClose, onSuccess }) {
  const allowedNext = ALLOWED_TRANSITIONS[order.status] ?? [];

  const [newStatus, setNewStatus] = useState(allowedNext[0] || '');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [carrier, setCarrier] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const needsTracking = newStatus === 'shipped';

  async function handleSubmit(e) {
    e.preventDefault();
    if (!newStatus) return;

    if (needsTracking && (!trackingNumber.trim() || !carrier.trim())) {
      setError('Tracking number and carrier are required for shipped status.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const payload = { status: newStatus, note };
      if (needsTracking) {
        payload.trackingNumber = trackingNumber.trim();
        payload.carrier = carrier.trim();
      }
      const result = await adminUpdateOrderStatus(order._id, payload);
      const updated = result?.data?.order ?? result;
      onSuccess(updated);
    } catch (err) {
      setError(err?.message || 'Failed to update status.');
    } finally {
      setSaving(false);
    }
  }

  if (allowedNext.length === 0) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4" role="dialog" aria-modal="true">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">No Status Transitions Available</h2>
          <p className="text-sm text-gray-500 mb-6">
            This order is in a terminal state ({STATUS_LABELS[order.status]}) and cannot be updated further.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="w-full px-4 py-2 text-sm font-medium text-white bg-gray-600 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4" role="dialog" aria-modal="true">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Update Order Status</h2>
        <p className="text-sm text-gray-500 mb-6">
          Current: <StatusBadge status={order.status} />
        </p>

        {error && (
          <div role="alert" className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* New status selector */}
          <div>
            <label htmlFor="newStatus" className="block text-sm font-medium text-gray-700 mb-1">
              New Status
            </label>
            <select
              id="newStatus"
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              {allowedNext.map((s) => (
                <option key={s} value={s}>{STATUS_LABELS[s] ?? s}</option>
              ))}
            </select>
          </div>

          {/* Tracking info — only required for shipped */}
          {needsTracking && (
            <>
              <div>
                <label htmlFor="carrier" className="block text-sm font-medium text-gray-700 mb-1">
                  Carrier <span className="text-red-500">*</span>
                </label>
                <input
                  id="carrier"
                  type="text"
                  value={carrier}
                  onChange={(e) => setCarrier(e.target.value)}
                  placeholder="e.g. DHL, FedEx, UPS"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  required
                />
              </div>
              <div>
                <label htmlFor="trackingNumber" className="block text-sm font-medium text-gray-700 mb-1">
                  Tracking Number <span className="text-red-500">*</span>
                </label>
                <input
                  id="trackingNumber"
                  type="text"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="e.g. 1Z999AA10123456784"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono"
                  required
                />
              </div>
            </>
          )}

          {/* Optional admin note */}
          <div>
            <label htmlFor="note" className="block text-sm font-medium text-gray-700 mb-1">
              Note (optional)
            </label>
            <textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              maxLength={500}
              placeholder="Internal note recorded in status history…"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !newStatus}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700 disabled:opacity-50 transition-colors"
            >
              {saving ? 'Saving…' : 'Update Status'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/**
 * Admin Order Detail page.
 * Route: /admin/orders/:orderId
 *
 * Shows full order detail including: customer info, all items with suitConfig,
 * shipping address, payment info, current status, and the status update modal.
 * Also allows processing a Stripe refund for cancelled orders.
 */
function AdminOrderDetailPage() {
  const { orderId } = useParams();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [refunding, setRefunding] = useState(false);
  const [refundError, setRefundError] = useState('');
  const [refundSuccess, setRefundSuccess] = useState(false);

  const loadOrder = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await adminGetOrderDetail(orderId);
      const data = result?.data ?? result;
      setOrder(data.order ?? data);
    } catch (err) {
      if (err?.status === 404) {
        setError('Order not found.');
      } else {
        setError(err?.message || 'Failed to load order.');
      }
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    loadOrder();
  }, [loadOrder]);

  async function handleRefund() {
    if (!window.confirm('Process a Stripe refund for this order? This cannot be undone.')) return;

    setRefunding(true);
    setRefundError('');
    setRefundSuccess(false);
    try {
      const result = await adminProcessRefund(orderId);
      const data = result?.data ?? result;
      setOrder(data.order ?? data);
      setRefundSuccess(true);
    } catch (err) {
      setRefundError(err?.message || 'Refund failed.');
    } finally {
      setRefunding(false);
    }
  }

  function handleStatusUpdateSuccess(updatedOrder) {
    setOrder(updatedOrder);
    setShowUpdateModal(false);
  }

  if (loading) {
    return (
      <main className="max-w-4xl mx-auto px-4 py-16 flex justify-center">
        <svg className="animate-spin h-8 w-8 text-gray-400" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </main>
    );
  }

  if (error) {
    return (
      <main className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div role="alert" className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-6">
          {error}
        </div>
        <Link to="/admin/orders" className="text-sm font-medium text-brand-600 hover:underline">
          Back to Orders
        </Link>
      </main>
    );
  }

  if (!order) return null;

  const customer = order.user
    ? `${order.user.firstName} ${order.user.lastName}`
    : 'Unknown Customer';

  const dateStr = new Date(order.createdAt).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const canUpdateStatus = (ALLOWED_TRANSITIONS[order.status] ?? []).length > 0;
  const canRefund = order.status === 'cancelled' && order.paymentIntentId && order.status !== 'refunded';

  return (
    <>
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Breadcrumb + header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Link to="/admin" className="hover:text-gray-700">Dashboard</Link>
            <span>/</span>
            <Link to="/admin/orders" className="hover:text-gray-700">Orders</Link>
            <span>/</span>
            <span className="font-mono text-gray-900">{order.orderNumber}</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-2xl font-serif font-bold text-gray-900">
                Order <span className="font-mono">{order.orderNumber}</span>
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">{dateStr}</p>
            </div>
            <div className="flex items-center gap-3">
              <StatusBadge status={order.status} />
              {canUpdateStatus && (
                <button
                  type="button"
                  onClick={() => setShowUpdateModal(true)}
                  className="px-4 py-2 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700 transition-colors"
                >
                  Update Status
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Refund notifications */}
        {refundError && (
          <div role="alert" className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-6 text-sm">
            {refundError}
          </div>
        )}
        {refundSuccess && (
          <div role="status" className="bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-3 mb-6 text-sm">
            Stripe refund processed successfully. Order status updated to Refunded.
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Customer info */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Customer</h2>
            <p className="text-sm font-semibold text-gray-900">{customer}</p>
            {order.user?.email && (
              <a
                href={`mailto:${order.user.email}`}
                className="text-sm text-brand-600 hover:underline"
              >
                {order.user.email}
              </a>
            )}
          </div>

          {/* Payment info */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Payment</h2>
            <dl className="space-y-1 text-sm">
              {order.paymentIntentId && (
                <div className="flex gap-2">
                  <dt className="text-gray-500 flex-shrink-0">Intent ID:</dt>
                  <dd className="font-mono text-gray-700 truncate">{order.paymentIntentId}</dd>
                </div>
              )}
              {order.paidAt && (
                <div className="flex gap-2">
                  <dt className="text-gray-500">Paid at:</dt>
                  <dd className="text-gray-700">
                    {new Date(order.paidAt).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </dd>
                </div>
              )}
            </dl>
            {canRefund && (
              <button
                type="button"
                onClick={handleRefund}
                disabled={refunding}
                className="mt-4 w-full px-3 py-2 text-sm font-medium text-red-600 border border-red-300 rounded-lg hover:bg-red-50 disabled:opacity-50 transition-colors"
              >
                {refunding ? 'Processing refund…' : 'Process Stripe Refund'}
              </button>
            )}
          </div>
        </div>

        {/* Shipping address */}
        {order.shippingAddress && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 mb-6">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Shipping Address</h2>
            <address className="not-italic text-sm text-gray-700 leading-relaxed">
              <p className="font-semibold">{order.shippingAddress.fullName}</p>
              <p>{order.shippingAddress.line1}</p>
              {order.shippingAddress.line2 && <p>{order.shippingAddress.line2}</p>}
              <p>
                {[
                  order.shippingAddress.city,
                  order.shippingAddress.state,
                  order.shippingAddress.postalCode,
                ]
                  .filter(Boolean)
                  .join(', ')}
              </p>
              <p>{order.shippingAddress.country}</p>
              {order.shippingAddress.phone && (
                <p className="mt-1 text-gray-500">{order.shippingAddress.phone}</p>
              )}
            </address>
          </div>
        )}

        {/* Tracking info (if shipped/delivered) */}
        {(order.trackingNumber || order.carrier) && (
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 mb-6">
            <h3 className="text-sm font-semibold text-purple-800 mb-2">Tracking Information</h3>
            {order.carrier && (
              <p className="text-sm text-purple-700">
                <span className="font-medium">Carrier:</span> {order.carrier}
              </p>
            )}
            {order.trackingNumber && (
              <p className="text-sm text-purple-700">
                <span className="font-medium">Tracking Number:</span>{' '}
                <span className="font-mono">{order.trackingNumber}</span>
              </p>
            )}
          </div>
        )}

        {/* Order items */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Items ({order.items?.length ?? 0})
            </h2>
          </div>
          <ul className="divide-y divide-gray-100">
            {(order.items || []).map((item, idx) => (
              <li key={item.cartItemId || idx} className="px-6 py-4">
                <div className="flex items-start justify-between mb-2">
                  <p className="text-sm font-semibold text-gray-900">{item.fabricName || 'Custom Suit'}</p>
                  <p className="text-sm font-semibold text-gray-900">
                    £{(item.unitPrice * item.quantity).toFixed(2)}
                  </p>
                </div>
                <p className="text-xs text-gray-500 mb-2">Qty: {item.quantity} × £{item.unitPrice?.toFixed(2)}</p>
                {item.suitConfig && Object.keys(item.suitConfig).length > 0 && (
                  <details className="text-xs text-gray-500">
                    <summary className="cursor-pointer hover:text-gray-700 font-medium">
                      Suit Configuration
                    </summary>
                    <pre className="mt-2 bg-gray-50 rounded p-2 overflow-x-auto text-xs leading-relaxed whitespace-pre-wrap">
                      {JSON.stringify(item.suitConfig, null, 2)}
                    </pre>
                  </details>
                )}
              </li>
            ))}
          </ul>
        </div>

        {/* Price breakdown */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">Price Breakdown</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-600">Subtotal</dt>
              <dd className="font-medium">£{order.subtotal?.toFixed(2)}</dd>
            </div>
            {order.discountAmount > 0 && (
              <div className="flex justify-between text-green-600">
                <dt>Discount{order.promoCode && ` (${order.promoCode})`}</dt>
                <dd>- £{order.discountAmount?.toFixed(2)}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-gray-600">Shipping ({order.shippingRegion})</dt>
              <dd className="font-medium">
                {order.shippingCost === 0 ? 'Free' : `£${order.shippingCost?.toFixed(2)}`}
              </dd>
            </div>
            {order.taxAmount > 0 && (
              <div className="flex justify-between">
                <dt className="text-gray-600">Tax</dt>
                <dd className="font-medium">£{order.taxAmount?.toFixed(2)}</dd>
              </div>
            )}
            <div className="flex justify-between pt-3 border-t border-gray-200 text-base font-bold">
              <dt className="text-gray-900">Total</dt>
              <dd className="text-gray-900">£{order.total?.toFixed(2)}</dd>
            </div>
          </dl>
        </div>

        {/* Status history */}
        {Array.isArray(order.statusHistory) && order.statusHistory.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">Status History</h2>
            <ol className="space-y-3">
              {[...order.statusHistory].reverse().map((event, idx) => (
                <li key={idx} className="flex gap-3 text-sm">
                  <span className="flex-shrink-0 text-gray-400 w-32">
                    {new Date(event.timestamp).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  <StatusBadge status={event.status} />
                  {event.note && (
                    <span className="text-gray-500 text-xs self-center">{event.note}</span>
                  )}
                </li>
              ))}
            </ol>
          </div>
        )}
      </main>

      {/* Status update modal */}
      {showUpdateModal && (
        <UpdateStatusModal
          order={order}
          onClose={() => setShowUpdateModal(false)}
          onSuccess={handleStatusUpdateSuccess}
        />
      )}
    </>
  );
}

export default AdminOrderDetailPage;
