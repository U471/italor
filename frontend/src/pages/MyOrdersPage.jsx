import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getMyOrders } from '../services/api';

const PAGE_SIZE = 10;

/**
 * Status badge colour map — aligned with backend ORDER_STATUSES.
 */
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

const STATUS_LABELS = {
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

/**
 * Order History page.
 * Route: /account/orders
 *
 * Lists all of the authenticated user's orders, paginated (10 per page),
 * newest first. Each row shows: order number, date, item count, total,
 * status badge, and action button (View Details / Write Review for delivered).
 */
function MyOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchOrders = useCallback(async (currentPage) => {
    setLoading(true);
    setError('');
    try {
      const result = await getMyOrders({ page: currentPage, limit: PAGE_SIZE });
      const data = result?.data ?? result;
      setOrders(data.orders || []);
      setTotal(data.total || 0);
      setPage(data.page || currentPage);
      setPages(data.pages || 1);
    } catch (err) {
      setError(err?.message || 'Failed to load orders.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders(1);
  }, [fetchOrders]);

  function handlePageChange(newPage) {
    if (newPage < 1 || newPage > pages) return;
    fetchOrders(newPage);
  }

  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-serif font-bold text-gray-900">My Orders</h1>
        {total > 0 && (
          <p className="text-sm text-gray-500">{total} order{total !== 1 ? 's' : ''} total</p>
        )}
      </div>

      {loading && (
        <div className="flex justify-center py-16">
          <svg className="animate-spin h-8 w-8 text-gray-400" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      )}

      {error && (
        <div role="alert" className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-6">
          {error}
        </div>
      )}

      {!loading && !error && orders.length === 0 && (
        <div className="text-center py-16">
          <p className="text-gray-500 mb-6">You haven't placed any orders yet.</p>
          <Link
            to="/fabrics"
            className="inline-block px-6 py-3 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 transition-colors"
          >
            Explore Fabrics
          </Link>
        </div>
      )}

      {!loading && orders.length > 0 && (
        <>
          {/* Desktop table */}
          <div className="hidden sm:block bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-6 py-3">Order</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-6 py-3">Date</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-6 py-3">Items</th>
                  <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wide px-6 py-3">Total</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-6 py-3">Status</th>
                  <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wide px-6 py-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.map((order) => (
                  <OrderRow key={order._id} order={order} />
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="sm:hidden space-y-4">
            {orders.map((order) => (
              <OrderCard key={order._id} order={order} />
            ))}
          </div>

          {/* Pagination */}
          {pages > 1 && (
            <Pagination page={page} pages={pages} onPageChange={handlePageChange} />
          )}
        </>
      )}
    </main>
  );
}

/**
 * A single order row for the desktop table view.
 *
 * @param {{ order: object }} props
 */
function OrderRow({ order }) {
  const dateStr = new Date(order.createdAt).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="px-6 py-4">
        <span className="font-mono text-sm font-semibold text-gray-900">{order.orderNumber}</span>
      </td>
      <td className="px-6 py-4 text-sm text-gray-600">{dateStr}</td>
      <td className="px-6 py-4 text-sm text-gray-600">
        {order.items?.length ?? 0} {order.items?.length === 1 ? 'item' : 'items'}
      </td>
      <td className="px-6 py-4 text-sm font-semibold text-gray-900 text-right">
        £{order.total?.toFixed(2)}
      </td>
      <td className="px-6 py-4">
        <StatusBadge status={order.status} />
      </td>
      <td className="px-6 py-4 text-right">
        <OrderActionButton order={order} />
      </td>
    </tr>
  );
}

/**
 * Mobile card for a single order.
 *
 * @param {{ order: object }} props
 */
function OrderCard({ order }) {
  const dateStr = new Date(order.createdAt).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="font-mono text-sm font-bold text-gray-900">{order.orderNumber}</p>
          <p className="text-xs text-gray-500 mt-0.5">{dateStr}</p>
        </div>
        <StatusBadge status={order.status} />
      </div>
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          {order.items?.length ?? 0} {order.items?.length === 1 ? 'item' : 'items'} · <strong>£{order.total?.toFixed(2)}</strong>
        </p>
        <OrderActionButton order={order} />
      </div>
    </div>
  );
}

/**
 * Action button for an order row.
 * - delivered: "Write a Review" (links to review form)
 * - otherwise: "View Details"
 *
 * @param {{ order: object }} props
 */
function OrderActionButton({ order }) {
  if (order.status === 'delivered') {
    const fabricId = order.items?.[0]?.fabricId;
    if (fabricId) {
      return (
        <Link
          to={`/account/orders/${order._id}/review`}
          className="text-xs font-medium text-purple-600 hover:underline"
        >
          Write a Review
        </Link>
      );
    }
  }

  return (
    <Link
      to={`/account/orders/${order._id}`}
      className="text-xs font-medium text-brand-600 hover:underline"
    >
      View Details
    </Link>
  );
}

/**
 * Status badge component.
 *
 * @param {{ status: string }} props
 */
function StatusBadge({ status }) {
  const cls = STATUS_STYLES[status] ?? 'bg-gray-100 text-gray-700';
  const label = STATUS_LABELS[status] ?? status;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${cls}`}>
      {label}
    </span>
  );
}

/**
 * Pagination controls.
 *
 * @param {{ page: number, pages: number, onPageChange: function }} props
 */
function Pagination({ page, pages, onPageChange }) {
  return (
    <nav aria-label="Order pagination" className="flex items-center justify-center gap-2 mt-6">
      <button
        type="button"
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        aria-label="Previous page"
      >
        Previous
      </button>

      {Array.from({ length: pages }, (_, i) => i + 1)
        .filter((p) => p === 1 || p === pages || Math.abs(p - page) <= 1)
        .reduce((acc, p, idx, arr) => {
          if (idx > 0 && p - arr[idx - 1] > 1) {
            acc.push('...');
          }
          acc.push(p);
          return acc;
        }, [])
        .map((p, idx) =>
          p === '...' ? (
            <span key={`ellipsis-${idx}`} className="px-2 text-gray-400">…</span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange(p)}
              aria-current={p === page ? 'page' : undefined}
              className={`w-9 h-9 text-sm font-medium rounded-lg border transition-colors
                ${p === page
                  ? 'bg-brand-600 text-white border-brand-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
            >
              {p}
            </button>
          )
        )}

      <button
        type="button"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= pages}
        className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        aria-label="Next page"
      >
        Next
      </button>
    </nav>
  );
}

export default MyOrdersPage;
