import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { adminGetStats, adminGetOrders } from '../../services/api';

const STATUS_COLORS = {
  pending_payment: '#f59e0b',
  payment_failed: '#ef4444',
  confirmed: '#3b82f6',
  in_production: '#6366f1',
  quality_check: '#f97316',
  shipped: '#a855f7',
  delivered: '#22c55e',
  cancelled: '#f87171',
  refunded: '#9ca3af',
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

/**
 * Formats a GBP currency value.
 *
 * @param {number} value
 * @returns {string}
 */
function formatCurrency(value) {
  return `£${Number(value ?? 0).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Single KPI card.
 *
 * @param {{ label: string, value: string|number, sub?: string, accent?: string }} props
 */
function KpiCard({ label, value, sub, accent = 'text-gray-900' }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{label}</p>
      <p className={`text-3xl font-bold ${accent}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

/**
 * Admin Dashboard page.
 * Route: /admin
 *
 * Shows KPI cards, a 30-day bar chart of daily orders, a donut chart of
 * orders by status, and a table of the 10 most recent orders pending action.
 */
function AdminDashboardPage() {
  const [stats, setStats] = useState(null);
  const [pendingOrders, setPendingOrders] = useState([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [statsError, setStatsError] = useState('');
  const [ordersError, setOrdersError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadStats() {
      setLoadingStats(true);
      setStatsError('');
      try {
        const result = await adminGetStats();
        if (!cancelled) setStats(result?.data ?? result);
      } catch (err) {
        if (!cancelled) setStatsError(err?.message || 'Failed to load statistics.');
      } finally {
        if (!cancelled) setLoadingStats(false);
      }
    }

    async function loadPendingOrders() {
      setLoadingOrders(true);
      setOrdersError('');
      try {
        // Fetch the 10 most recent orders that need admin action
        const result = await adminGetOrders({ limit: 10, status: 'confirmed' });
        const data = result?.data ?? result;
        if (!cancelled) setPendingOrders(data.orders || []);
      } catch (err) {
        if (!cancelled) setOrdersError(err?.message || 'Failed to load pending orders.');
      } finally {
        if (!cancelled) setLoadingOrders(false);
      }
    }

    loadStats();
    loadPendingOrders();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-serif font-bold text-gray-900">Admin Dashboard</h1>
        <nav className="flex gap-3 text-sm">
          <Link to="/admin/orders" className="text-brand-600 hover:underline font-medium">All Orders</Link>
          <Link to="/admin/fabrics" className="text-brand-600 hover:underline font-medium">Fabrics</Link>
        </nav>
      </div>

      {/* KPI Cards */}
      {loadingStats ? (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-200 p-5 animate-pulse">
              <div className="h-3 bg-gray-200 rounded w-3/4 mb-3" />
              <div className="h-8 bg-gray-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : statsError ? (
        <div role="alert" className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-8">
          {statsError}
        </div>
      ) : stats ? (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <KpiCard label="Orders Today" value={stats.ordersToday} />
          <KpiCard label="Revenue Today" value={formatCurrency(stats.revenueToday)} accent="text-green-600" />
          <KpiCard
            label="Pending Action"
            value={stats.ordersPendingAction}
            sub="Confirmed + In Tailoring + QC"
            accent={stats.ordersPendingAction > 0 ? 'text-orange-600' : 'text-gray-900'}
          />
          <KpiCard label="Revenue This Month" value={formatCurrency(stats.revenueThisMonth)} accent="text-indigo-600" />
          <KpiCard label="Active Users" value={stats.totalActiveUsers.toLocaleString()} />
        </div>
      ) : null}

      {/* Charts */}
      {!loadingStats && !statsError && stats && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Daily orders bar chart (last 30 days) */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
              Daily Orders — Last 30 Days
            </h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={stats.dailyOrders} margin={{ top: 0, right: 8, left: -20, bottom: 0 }}>
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10 }}
                  tickFormatter={(v) => {
                    const d = new Date(v + 'T00:00:00');
                    return `${d.getDate()}/${d.getMonth() + 1}`;
                  }}
                  interval={4}
                />
                <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                <Tooltip
                  formatter={(value, name) =>
                    name === 'revenue' ? [formatCurrency(value), 'Revenue'] : [value, 'Orders']
                  }
                  labelFormatter={(label) => {
                    const d = new Date(label + 'T00:00:00');
                    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
                  }}
                />
                <Bar dataKey="count" fill="#6366f1" radius={[3, 3, 0, 0]} name="orders" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Orders by status donut chart */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
              Orders by Status
            </h2>
            {stats.ordersByStatus.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-16">No orders yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={stats.ordersByStatus}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="45%"
                    innerRadius={55}
                    outerRadius={80}
                  >
                    {stats.ordersByStatus.map((entry) => (
                      <Cell
                        key={entry.status}
                        fill={STATUS_COLORS[entry.status] ?? '#9ca3af'}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value, name) => [value, STATUS_LABELS[name] ?? name]}
                  />
                  <Legend
                    formatter={(value) => STATUS_LABELS[value] ?? value}
                    iconSize={8}
                    wrapperStyle={{ fontSize: '11px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      )}

      {/* Pending orders list */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
            Confirmed Orders — Pending Processing
          </h2>
          <Link to="/admin/orders?status=confirmed" className="text-xs font-medium text-brand-600 hover:underline">
            View all
          </Link>
        </div>

        {loadingOrders && (
          <div className="flex justify-center py-10">
            <svg className="animate-spin h-6 w-6 text-gray-400" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        )}

        {ordersError && (
          <div role="alert" className="px-6 py-4 text-sm text-red-600">{ordersError}</div>
        )}

        {!loadingOrders && !ordersError && pendingOrders.length === 0 && (
          <p className="px-6 py-10 text-sm text-gray-500 text-center">
            No confirmed orders awaiting processing.
          </p>
        )}

        {!loadingOrders && pendingOrders.length > 0 && (
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-6 py-3">Order</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-6 py-3">Customer</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-6 py-3">Date</th>
                <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wide px-6 py-3">Total</th>
                <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wide px-6 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {pendingOrders.map((order) => {
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
                    <td className="px-6 py-3 text-sm text-gray-700">{customer}</td>
                    <td className="px-6 py-3 text-sm text-gray-500">{dateStr}</td>
                    <td className="px-6 py-3 text-sm font-semibold text-gray-900 text-right">
                      £{order.total?.toFixed(2)}
                    </td>
                    <td className="px-6 py-3 text-right">
                      <Link
                        to={`/admin/orders/${order._id}`}
                        className="text-xs font-medium text-brand-600 hover:underline"
                      >
                        Process
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </main>
  );
}

export default AdminDashboardPage;
