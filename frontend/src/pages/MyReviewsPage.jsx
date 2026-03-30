import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getMyReviews, markReviewHelpful, deleteReview } from '../services/api';
import ReviewCard from '../components/ReviewCard/ReviewCard';
import StarRating from '../components/StarRating/StarRating';

const PAGE_SIZE = 10;

/**
 * MyReviewsPage — /account/reviews
 *
 * Lists all reviews written by the authenticated user.
 * Each review links to the fabric detail page.
 * Users can delete their own reviews.
 */
function MyReviewsPage() {
  const [reviews, setReviews] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [deleteError, setDeleteError] = useState('');

  const fetchReviews = useCallback(async (currentPage) => {
    setLoading(true);
    setError('');
    try {
      const result = await getMyReviews({ page: currentPage, limit: PAGE_SIZE });
      const data = result?.data ?? result;
      setReviews(data.reviews || []);
      setTotal(data.total || 0);
      setPage(data.page || currentPage);
      setPages(data.pages || 1);
    } catch (err) {
      setError(err?.message || 'Failed to load reviews.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReviews(1);
  }, [fetchReviews]);

  async function handleHelpful(reviewId) {
    try {
      await markReviewHelpful(reviewId);
      // Optimistically bump the count in the local list
      setReviews((prev) =>
        prev.map((r) =>
          r._id === reviewId ? { ...r, helpfulVotes: (r.helpfulVotes ?? 0) + 1 } : r
        )
      );
    } catch {
      // Non-fatal — silently ignore (duplicate vote 409 etc.)
    }
  }

  async function handleDelete(reviewId) {
    if (!window.confirm('Are you sure you want to delete this review?')) return;
    setDeletingId(reviewId);
    setDeleteError('');
    try {
      await deleteReview(reviewId);
      setReviews((prev) => prev.filter((r) => r._id !== reviewId));
      setTotal((prev) => Math.max(prev - 1, 0));
    } catch (err) {
      setDeleteError(err?.message || 'Failed to delete review.');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-serif font-bold text-gray-900">My Reviews</h1>
        {total > 0 && (
          <p className="text-sm text-gray-500">{total} review{total !== 1 ? 's' : ''}</p>
        )}
      </div>

      {loading && (
        <div className="flex justify-center py-16">
          <svg className="animate-spin h-8 w-8 text-gray-400" viewBox="0 0 24 24" fill="none" aria-label="Loading reviews">
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

      {deleteError && (
        <div role="alert" className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-6">
          {deleteError}
        </div>
      )}

      {!loading && !error && reviews.length === 0 && (
        <div className="text-center py-16">
          <p className="text-gray-500 mb-6">You haven't written any reviews yet.</p>
          <Link
            to="/fabrics"
            className="inline-block px-6 py-3 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 transition-colors"
          >
            Explore Fabrics
          </Link>
        </div>
      )}

      {!loading && reviews.length > 0 && (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review._id} className="relative">
              {/* Fabric link banner */}
              {review.fabric && (
                <div className="flex items-center justify-between mb-2">
                  <Link
                    to={`/fabrics/${review.fabric._id ?? review.fabric}`}
                    className="flex items-center gap-2 text-sm font-medium text-brand-600 hover:text-brand-700 transition-colors"
                  >
                    {review.fabric.thumbnailUrl && (
                      <img
                        src={review.fabric.thumbnailUrl}
                        alt=""
                        className="w-8 h-8 rounded object-cover"
                      />
                    )}
                    {review.fabric.name ?? 'View Fabric'}
                  </Link>
                  <div className="flex items-center gap-2">
                    <StarRating rating={review.rating} size="xs" />
                  </div>
                </div>
              )}

              <ReviewCard review={review} onHelpful={handleHelpful} />

              {/* Delete button */}
              <button
                type="button"
                onClick={() => handleDelete(review._id)}
                disabled={deletingId === review._id}
                className="mt-2 text-xs text-red-500 hover:text-red-700 disabled:opacity-50 transition-colors"
                aria-label="Delete review"
              >
                {deletingId === review._id ? 'Deleting...' : 'Delete review'}
              </button>
            </div>
          ))}

          {pages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-4">
              <button
                type="button"
                onClick={() => fetchReviews(page - 1)}
                disabled={page <= 1}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <span className="text-sm text-gray-600">Page {page} of {pages}</span>
              <button
                type="button"
                onClick={() => fetchReviews(page + 1)}
                disabled={page >= pages}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </main>
  );
}

export default MyReviewsPage;
