import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { adminGetOrders } from '../../services/api';

const PAGE_SIZE = 20;

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'pending_payment', label: 'Pending Payment' },
  { value: 'payment_failed', label: 'Payment Failed' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'in_production', label: 'In Tailoring' },
  { value: 'quality_check', label: 'Quality Check' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'refunded', label: 'Refunded' },
];

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
  const label = STATUS_OPTIONS.find((o) => o.value === status)?.label ?? status;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${cls}`}>
      {label}
    </span>
  );
}

/**
 * Admin Orders list page.
 * Route: /admin/orders
 *
 * Paginated list of ALL orders with status filter dropdown.
 */
function AdminOrdersPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const statusFilter = searchParams.get('status') || '';

  const [orders, setOrders] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchOrders = useCallback(async (currentPage, status) => {
    setLoading(true);
    setError('');
    try {
      const params = { page: currentPage, limit: PAGE_SIZE };
      if (status) params.status = status;
      const result = await adminGetOrders(params);
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
    fetchOrders(1, statusFilter);
  }, [fetchOrders, statusFilter]);

  function handleStatusChange(e) {
    setSearchParams(e.target.value ? { status: e.target.value } : {});
  }

  function handlePageChange(newPage) {
    if (newPage < 1 || newPage > pages) return;
    fetchOrders(newPage, statusFilter);
  }

  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <Link to="/admin" className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
            Dashboard
          </Link>
          <span className="mx-2 text-gray-300">/</span>
          <h1 className="inline text-2xl font-serif font-bold text-gray-900">All Orders</h1>
        </div>
        <div className="flex items-center gap-3">
          {total > 0 && (
            <p className="text-sm text-gray-500">{total} order{total !== 1 ? 's' : ''}</p>
          )}
          <select
            value={statusFilter}
            onChange={handleStatusChange}
            className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            aria-label="Filter by status"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
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
          <p className="text-gray-500">No orders found{statusFilter ? ` with status "${statusFilter}"` : ''}.</p>
        </div>
      )}

      {!loading && orders.length > 0 && (
        <>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-6 py-3">Order</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-6 py-3">Customer</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-6 py-3">Date</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-6 py-3">Items</th>
                  <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wide px-6 py-3">Total</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-6 py-3">Status</th>
                  <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wide px-6 py-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.map((order) => {
                  const customer = order.user
                    ? `${order.user.firstName} ${order.user.lastName}`
                    : 'Unknown';
                  const dateStr = new Date(order.createdAt).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  });
                  return (
                    <tr key={order._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-3">
                        <span className="font-mono text-sm font-semibold text-gray-900">{order.orderNumber}</span>
                      </td>
                      <td className="px-6 py-3">
                        <p className="text-sm text-gray-900">{customer}</p>
                        {order.user?.email && (
                          <p className="text-xs text-gray-500">{order.user.email}</p>
                        )}
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-500">{dateStr}</td>
                      <td className="px-6 py-3 text-sm text-gray-600">
                        {order.items?.length ?? 0}
                      </td>
                      <td className="px-6 py-3 text-sm font-semibold text-gray-900 text-right">
                        £{order.total?.toFixed(2)}
                      </td>
                      <td className="px-6 py-3">
                        <StatusBadge status={order.status} />
                      </td>
                      <td className="px-6 py-3 text-right">
                        <Link
                          to={`/admin/orders/${order._id}`}
                          className="text-xs font-medium text-brand-600 hover:underline"
                        >
                          Manage
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pages > 1 && (
            <nav aria-label="Order pagination" className="flex items-center justify-center gap-2 mt-6">
              <button
                type="button"
                onClick={() => handlePageChange(page - 1)}
                disabled={page <= 1}
                className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <span className="text-sm text-gray-600">Page {page} of {pages}</span>
              <button
                type="button"
                onClick={() => handlePageChange(page + 1)}
                disabled={page >= pages}
                className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </nav>
          )}
        </>
      )}
    </main>
  );
}

export default AdminOrdersPage;
