import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getOrderDetail, createReview } from '../services/api';
import ReviewForm from '../components/ReviewForm/ReviewForm';

/**
 * WriteReviewPage — /account/orders/:orderId/review
 *
 * Loads the order so the page can pre-populate the fabric name and order
 * reference in the review form. Validates the order is delivered before
 * allowing the user to submit.
 *
 * On successful submission the user is redirected to the fabric detail
 * page where the new review will appear.
 */
function WriteReviewPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  // Load the order to get fabric details
  useEffect(() => {
    setIsLoading(true);
    setLoadError('');
    getOrderDetail(orderId)
      .then((result) => {
        const data = result?.data ?? result;
        const loaded = data?.order ?? data;
        setOrder(loaded);
      })
      .catch((err) => {
        setLoadError(err?.message || 'Failed to load order details.');
      })
      .finally(() => setIsLoading(false));
  }, [orderId]);

  /**
   * Handles review form submission.
   *
   * @param {{ rating: number, fitRating?: number, title?: string, body?: string }} payload
   */
  async function handleSubmit(payload) {
    if (!order) return;

    const firstItem = order.items?.[0];
    if (!firstItem?.fabricId) {
      setSubmitError('No fabric found on this order.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    try {
      await createReview(firstItem.fabricId, { ...payload, orderId });
      setSubmitted(true);
    } catch (err) {
      setSubmitError(err?.message || 'Failed to submit review. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  // ── Loading state ────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <svg className="animate-spin h-8 w-8 text-gray-400" viewBox="0 0 24 24" fill="none" aria-label="Loading">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </main>
    );
  }

  // ── Error state ──────────────────────────────────────────────────────────────
  if (loadError || !order) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-gray-600 mb-4">{loadError || 'Order not found.'}</p>
          <Link to="/account/orders" className="text-brand-600 hover:text-brand-700 text-sm font-medium">
            Back to Orders
          </Link>
        </div>
      </main>
    );
  }

  // ── Order not yet delivered ──────────────────────────────────────────────────
  if (order.status !== 'delivered') {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl p-8 border border-gray-200 text-center">
          <p className="text-gray-700 mb-2 font-medium">Reviews are available after delivery.</p>
          <p className="text-sm text-gray-500 mb-6">
            Order <span className="font-mono font-semibold">{order.orderNumber}</span> is currently{' '}
            <span className="capitalize">{order.status?.replace(/_/g, ' ')}</span>.
          </p>
          <Link
            to={`/account/orders/${orderId}`}
            className="text-brand-600 hover:text-brand-700 text-sm font-medium"
          >
            View Order Details
          </Link>
        </div>
      </main>
    );
  }

  // ── Success state ────────────────────────────────────────────────────────────
  if (submitted) {
    const fabricId = order.items?.[0]?.fabricId;
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl p-8 border border-gray-200 text-center">
          <div className="text-4xl mb-4">★</div>
          <h2 className="text-xl font-serif font-bold text-gray-900 mb-2">Thank you for your review!</h2>
          <p className="text-sm text-gray-500 mb-8">
            Your review has been published and will help other shoppers make informed decisions.
          </p>
          <div className="flex flex-col gap-3">
            {fabricId && (
              <Link
                to={`/fabrics/${fabricId}`}
                className="block w-full py-3 px-6 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-800 transition-colors"
              >
                View Fabric Page
              </Link>
            )}
            <Link
              to="/account/orders"
              className="block w-full py-3 px-6 border border-gray-300 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors"
            >
              Back to My Orders
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // ── Review form ──────────────────────────────────────────────────────────────
  const firstItem  = order.items?.[0];
  const fabricName = firstItem?.fabricName || 'Fabric';

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Nav bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link to="/" className="text-xl font-serif font-bold text-gray-900 hover:text-brand-700 transition-colors">
            iTailor
          </Link>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
        {/* Breadcrumb */}
        <nav aria-label="breadcrumb" className="mb-6 text-sm text-gray-500 flex items-center gap-2">
          <Link to="/account/orders" className="hover:text-brand-600 transition-colors">My Orders</Link>
          <span>/</span>
          <Link to={`/account/orders/${orderId}`} className="hover:text-brand-600 transition-colors">
            {order.orderNumber}
          </Link>
          <span>/</span>
          <span className="text-gray-900 font-medium">Write a Review</span>
        </nav>

        <h1 className="text-3xl font-serif font-bold text-gray-900 mb-8">Write a Review</h1>

        <div className="bg-white rounded-2xl p-8 border border-gray-200">
          <ReviewForm
            fabricName={fabricName}
            orderNumber={order.orderNumber}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            submitError={submitError}
            onCancel={() => navigate(`/account/orders/${orderId}`)}
          />
        </div>
      </div>
    </main>
  );
}

export default WriteReviewPage;
