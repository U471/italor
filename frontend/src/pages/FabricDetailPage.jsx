import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getFabricById, getFabricReviews } from '../services/api';
import FabricCard from '../components/FabricCard/FabricCard';
import ImageGallery from '../components/ImageGallery/ImageGallery';
import StarRating from '../components/StarRating/StarRating';

/**
 * FabricDetailPage — /fabrics/:id
 *
 * Displays full fabric information:
 *  - Image gallery with zoom on hover
 *  - Fabric specs (material, weight, origin, season, care)
 *  - Average rating and review count
 *  - "Start Designing with This Fabric" CTA
 *  - Paginated customer reviews
 *  - Related fabrics grid
 *  - Breadcrumb navigation
 */
function FabricDetailPage() {
  const { id } = useParams();

  const [fabric, setFabric] = useState(null);
  const [related, setRelated] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [reviews, setReviews] = useState([]);
  const [reviewTotal, setReviewTotal] = useState(0);
  const [reviewPage, setReviewPage] = useState(1);
  const [reviewPages, setReviewPages] = useState(1);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  // Load fabric detail
  useEffect(() => {
    setIsLoading(true);
    setError('');
    getFabricById(id)
      .then(({ fabric: f, related: r }) => {
        setFabric(f);
        setRelated(r || []);
      })
      .catch(() => setError('Failed to load fabric. Please try again.'))
      .finally(() => setIsLoading(false));
  }, [id]);

  // Load reviews whenever fabric is loaded or page changes
  useEffect(() => {
    if (!fabric) return;
    setReviewsLoading(true);
    getFabricReviews(id, { page: reviewPage, limit: 5 })
      .then((result) => {
        setReviews(result.reviews);
        setReviewTotal(result.total);
        setReviewPages(result.pages);
      })
      .catch(() => {}) // non-fatal — reviews section just stays empty
      .finally(() => setReviewsLoading(false));
  }, [fabric, id, reviewPage]); // eslint-disable-line react-hooks/exhaustive-deps

  if (isLoading) {
    return <FabricDetailSkeleton />;
  }

  if (error || !fabric) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-5xl mb-4">🧵</p>
          <p className="text-gray-600 font-medium mb-4">{error || 'Fabric not found.'}</p>
          <Link to="/fabrics" className="text-brand-600 hover:text-brand-700 font-medium text-sm">
            ← Back to Catalog
          </Link>
        </div>
      </main>
    );
  }

  const { name, material, color, pattern, price, weight, origin, season, careInstructions, patternDescription, images, averageRating, reviewCount } = fabric;

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header / Nav */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link to="/" className="text-xl font-serif font-bold text-gray-900 hover:text-brand-700 transition-colors">
            iTailor
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav aria-label="breadcrumb" className="mb-6 text-sm text-gray-500 flex items-center gap-2">
          <Link to="/" className="hover:text-brand-600 transition-colors">Home</Link>
          <span>/</span>
          <Link to="/fabrics" className="hover:text-brand-600 transition-colors">Fabrics</Link>
          <span>/</span>
          <span className="text-gray-900 font-medium truncate max-w-xs">{name}</span>
        </nav>

        {/* Main grid — image + info */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-16">
          {/* Image Gallery */}
          <ImageGallery images={images} name={name} thumbnailUrl={fabric.thumbnailUrl} />

          {/* Fabric Info */}
          <div className="flex flex-col">
            <h1 className="text-3xl font-serif font-bold text-gray-900 leading-tight">{name}</h1>

            {/* Rating summary */}
            <div className="mt-2 flex items-center gap-3">
              {averageRating ? (
                <>
                  <StarRating rating={averageRating} size="sm" />
                  <span className="text-sm text-gray-500">
                    {averageRating} ({reviewCount} {reviewCount === 1 ? 'review' : 'reviews'})
                  </span>
                </>
              ) : (
                <span className="text-sm text-gray-400">No reviews yet</span>
              )}
            </div>

            {/* Price */}
            <p className="mt-4 text-4xl font-bold text-gray-900">
              £{price.toLocaleString()}
              <span className="text-base font-normal text-gray-500 ml-2">/ meter</span>
            </p>

            {/* Badges */}
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm capitalize">{material}</span>
              <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm capitalize">{pattern}</span>
              <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm capitalize">{color}</span>
            </div>

            {/* Pattern description */}
            {patternDescription && (
              <p className="mt-4 text-gray-600 leading-relaxed">{patternDescription}</p>
            )}

            {/* Specs table */}
            <div className="mt-6 border border-gray-200 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <tbody>
                  {origin && <SpecRow label="Origin" value={origin} />}
                  {weight && <SpecRow label="Weight" value={`${weight} GSM`} />}
                  {season && <SpecRow label="Season" value={<span className="capitalize">{season.replace('-', ' ')}</span>} />}
                  <SpecRow label="Pattern" value={<span className="capitalize">{pattern}</span>} />
                  <SpecRow label="Material" value={<span className="capitalize">{material}</span>} />
                  {fabric.stock !== undefined && (
                    <SpecRow
                      label="Availability"
                      value={
                        fabric.stock > 0
                          ? <span className="text-green-600 font-medium">In Stock ({fabric.stock}m available)</span>
                          : <span className="text-red-500 font-medium">Out of Stock</span>
                      }
                    />
                  )}
                </tbody>
              </table>
            </div>

            {/* Care instructions */}
            {careInstructions && (
              <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-1">Care Instructions</p>
                <p className="text-sm text-amber-800">{careInstructions}</p>
              </div>
            )}

            {/* CTA */}
            <div className="mt-8">
              <Link
                to={`/builder?fabric=${id}`}
                className="block w-full text-center px-6 py-4 bg-gray-900 text-white text-base font-semibold rounded-xl hover:bg-gray-800 transition-colors"
              >
                Start Designing with This Fabric
              </Link>
              <Link
                to="/fabrics"
                className="block w-full text-center mt-3 px-6 py-4 border border-gray-300 text-gray-700 text-base font-medium rounded-xl hover:bg-gray-50 transition-colors"
              >
                ← Back to Catalog
              </Link>
            </div>
          </div>
        </div>

        {/* Reviews section */}
        <section aria-label="customer reviews" className="mb-16">
          <h2 className="text-2xl font-serif font-bold text-gray-900 mb-6">
            Customer Reviews
            {reviewTotal > 0 && <span className="text-base font-normal text-gray-500 ml-2">({reviewTotal})</span>}
          </h2>

          {reviewsLoading && (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="bg-white rounded-xl p-6 border border-gray-200 animate-pulse space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/3" />
                  <div className="h-12 bg-gray-200 rounded" />
                </div>
              ))}
            </div>
          )}

          {!reviewsLoading && reviews.length === 0 && (
            <div className="bg-white rounded-xl p-8 border border-gray-200 text-center text-gray-500">
              No reviews yet. Be the first to review this fabric!
            </div>
          )}

          {!reviewsLoading && reviews.length > 0 && (
            <div className="space-y-4">
              {reviews.map((review) => (
                <ReviewCard key={review._id} review={review} />
              ))}

              {reviewPages > 1 && (
                <div className="flex items-center justify-center gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setReviewPage((p) => p - 1)}
                    disabled={reviewPage <= 1}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-gray-600">Page {reviewPage} of {reviewPages}</span>
                  <button
                    type="button"
                    onClick={() => setReviewPage((p) => p + 1)}
                    disabled={reviewPage >= reviewPages}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Related fabrics */}
        {related.length > 0 && (
          <section aria-label="related fabrics">
            <h2 className="text-2xl font-serif font-bold text-gray-900 mb-6">You Might Also Like</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {related.map((f) => (
                <FabricCard key={f._id} fabric={f} />
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SpecRow({ label, value }) {
  return (
    <tr className="border-b border-gray-100 last:border-0">
      <td className="px-4 py-3 text-gray-500 font-medium w-32 bg-gray-50">{label}</td>
      <td className="px-4 py-3 text-gray-900">{value}</td>
    </tr>
  );
}

function ReviewCard({ review }) {
  const { displayName, rating, fitRating, title, body, isVerifiedPurchase, createdAt } = review;
  const date = new Date(createdAt).toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric' });

  return (
    <article className="bg-white rounded-xl p-6 border border-gray-200">
      <div className="flex items-start justify-between gap-4 mb-2">
        <div>
          <p className="font-semibold text-gray-900 text-sm">{displayName}</p>
          <p className="text-xs text-gray-400 mt-0.5">{date}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {isVerifiedPurchase && (
            <span className="text-xs px-2 py-0.5 bg-green-50 text-green-700 border border-green-200 rounded-full font-medium">
              Verified Purchase
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4 mb-3">
        <div className="flex items-center gap-1.5">
          <StarRating rating={rating} size="xs" />
          <span className="text-xs text-gray-500">Quality</span>
        </div>
        {fitRating && (
          <div className="flex items-center gap-1.5">
            <StarRating rating={fitRating} size="xs" />
            <span className="text-xs text-gray-500">Fit</span>
          </div>
        )}
      </div>

      {title && <p className="font-semibold text-gray-900 text-sm mb-1">{title}</p>}
      {body && <p className="text-gray-600 text-sm leading-relaxed">{body}</p>}
    </article>
  );
}

function FabricDetailSkeleton() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 h-14" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="h-4 bg-gray-200 rounded w-48 mb-6 animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="aspect-square bg-gray-200 rounded-2xl animate-pulse" />
          <div className="space-y-4 animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-3/4" />
            <div className="h-4 bg-gray-200 rounded w-1/3" />
            <div className="h-10 bg-gray-200 rounded w-1/2" />
            <div className="flex gap-2">
              {[1, 2, 3].map((i) => <div key={i} className="h-6 bg-gray-200 rounded-full w-16" />)}
            </div>
            <div className="h-20 bg-gray-200 rounded" />
            <div className="h-12 bg-gray-200 rounded-xl" />
          </div>
        </div>
      </div>
    </main>
  );
}

export default FabricDetailPage;
