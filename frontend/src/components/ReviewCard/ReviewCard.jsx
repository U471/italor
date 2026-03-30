import PropTypes from 'prop-types';
import StarRating from '../StarRating/StarRating';

/**
 * ReviewCard — displays a single customer review.
 *
 * Shows: reviewer display name, date, verified-purchase badge, star rating,
 * optional fit rating, title, body, and helpful vote count.
 *
 * @param {{ review: object, onHelpful?: function }} props
 */
function ReviewCard({ review, onHelpful }) {
  const {
    displayName,
    rating,
    fitRating,
    title,
    body,
    isVerifiedPurchase,
    helpfulVotes,
    createdAt,
  } = review;

  const date = new Date(createdAt).toLocaleDateString('en-GB', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <article className="bg-white rounded-xl p-6 border border-gray-200" data-testid="review-card">
      {/* Header: name + date + badge */}
      <div className="flex items-start justify-between gap-4 mb-2">
        <div>
          <p className="font-semibold text-gray-900 text-sm">{displayName}</p>
          <time className="text-xs text-gray-400 mt-0.5 block" dateTime={createdAt}>
            {date}
          </time>
        </div>
        {isVerifiedPurchase && (
          <span className="inline-flex items-center text-xs px-2 py-0.5 bg-green-50 text-green-700 border border-green-200 rounded-full font-medium flex-shrink-0">
            Verified Purchase
          </span>
        )}
      </div>

      {/* Ratings row */}
      <div className="flex flex-wrap items-center gap-4 mb-3">
        <div className="flex items-center gap-1.5">
          <StarRating rating={rating} size="sm" />
          <span className="text-xs text-gray-500">Quality</span>
        </div>
        {fitRating && (
          <div className="flex items-center gap-1.5">
            <StarRating rating={fitRating} size="sm" />
            <span className="text-xs text-gray-500">Fit</span>
          </div>
        )}
      </div>

      {/* Review content */}
      {title && (
        <p className="font-semibold text-gray-900 text-sm mb-1">{title}</p>
      )}
      {body && (
        <p className="text-gray-600 text-sm leading-relaxed">{body}</p>
      )}

      {/* Helpful footer */}
      {onHelpful && (
        <div className="mt-4 pt-3 border-t border-gray-100 flex items-center gap-3">
          <span className="text-xs text-gray-500">
            {helpfulVotes ?? 0} {helpfulVotes === 1 ? 'person' : 'people'} found this helpful
          </span>
          <button
            type="button"
            onClick={() => onHelpful(review._id)}
            className="text-xs font-medium text-brand-600 hover:text-brand-700 transition-colors"
            aria-label="Mark review as helpful"
          >
            Helpful
          </button>
        </div>
      )}
    </article>
  );
}

ReviewCard.propTypes = {
  review: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    displayName: PropTypes.string.isRequired,
    rating: PropTypes.number.isRequired,
    fitRating: PropTypes.number,
    title: PropTypes.string,
    body: PropTypes.string,
    isVerifiedPurchase: PropTypes.bool,
    helpfulVotes: PropTypes.number,
    createdAt: PropTypes.string.isRequired,
  }).isRequired,
  /** Optional callback called with reviewId when the user clicks "Helpful". */
  onHelpful: PropTypes.func,
};

export default ReviewCard;
