/**
 * StarRating — renders filled/half/empty stars for a given rating.
 *
 * Props:
 *  - rating: number   Rating value (0–5)
 *  - size:   string   'xs' | 'sm' | 'md' (default 'sm')
 */
function StarRating({ rating = 0, size = 'sm' }) {
  const sizeClass = { xs: 'text-xs', sm: 'text-sm', md: 'text-base' }[size] || 'text-sm';

  return (
    <div className={`flex items-center gap-0.5 ${sizeClass}`} aria-label={`${rating} out of 5 stars`} role="img">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = rating >= star;
        const half = !filled && rating >= star - 0.5;
        return (
          <span key={star} aria-hidden="true" className={filled ? 'text-amber-400' : half ? 'text-amber-300' : 'text-gray-300'}>
            {filled ? '★' : half ? '½' : '☆'}
          </span>
        );
      })}
    </div>
  );
}

export default StarRating;
