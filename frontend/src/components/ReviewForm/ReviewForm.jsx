import { useState } from 'react';
import PropTypes from 'prop-types';

const STARS = [1, 2, 3, 4, 5];

/**
 * InteractiveStars — clickable star rating input.
 *
 * @param {{ value: number, onChange: function, label: string, name: string }} props
 */
function InteractiveStars({ value, onChange, label, name }) {
  const [hovered, setHovered] = useState(0);

  return (
    <fieldset>
      <legend className="text-sm font-medium text-gray-700 mb-1">{label}</legend>
      <div className="flex items-center gap-1" role="group" aria-label={label}>
        {STARS.map((star) => {
          const active = (hovered || value) >= star;
          return (
            <button
              key={star}
              type="button"
              aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
              aria-pressed={value === star}
              onClick={() => onChange(star)}
              onMouseEnter={() => setHovered(star)}
              onMouseLeave={() => setHovered(0)}
              className={`text-2xl transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded ${
                active ? 'text-amber-400' : 'text-gray-300'
              }`}
              data-testid={`star-${name}-${star}`}
            >
              ★
            </button>
          );
        })}
        {value > 0 && (
          <span className="ml-2 text-sm text-gray-500">{value} / 5</span>
        )}
      </div>
    </fieldset>
  );
}

InteractiveStars.propTypes = {
  value: PropTypes.number.isRequired,
  onChange: PropTypes.func.isRequired,
  label: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
};

// ─────────────────────────────────────────────────────────────────────────────

/**
 * ReviewForm — form for submitting a fabric review.
 *
 * Props:
 *  - fabricName: string       Name of the fabric being reviewed
 *  - orderNumber: string      Human-readable order reference
 *  - onSubmit: async function Called with { rating, fitRating, title, body }
 *  - isSubmitting: bool       Shows loading state on submit button
 *  - submitError: string      Error message from parent (e.g., duplicate review)
 *  - onCancel: function       Optional cancel handler
 */
function ReviewForm({
  fabricName,
  orderNumber = '',
  onSubmit,
  isSubmitting = false,
  submitError = '',
  onCancel = null,
}) {
  const [rating, setRating] = useState(0);
  const [fitRating, setFitRating] = useState(0);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [errors, setErrors] = useState({});

  function validate() {
    const next = {};
    if (rating < 1 || rating > 5) {
      next.rating = 'Please select a star rating.';
    }
    if (title.trim().length > 200) {
      next.title = 'Title cannot exceed 200 characters.';
    }
    if (body.trim().length > 0 && body.trim().length < 20) {
      next.body = 'Review body must be at least 20 characters.';
    }
    if (body.trim().length > 2000) {
      next.body = 'Review body cannot exceed 2000 characters.';
    }
    return next;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors({});
    await onSubmit({
      rating,
      fitRating: fitRating || undefined,
      title: title.trim() || undefined,
      body: body.trim() || undefined,
    });
  }

  const bodyLen = body.trim().length;

  return (
    <form onSubmit={handleSubmit} noValidate aria-label="Submit your review" className="space-y-6">
      {/* Context header */}
      <div className="pb-4 border-b border-gray-200">
        <p className="text-sm text-gray-500">
          Reviewing: <span className="font-semibold text-gray-800">{fabricName}</span>
        </p>
        {orderNumber && (
          <p className="text-xs text-gray-400 mt-0.5">Order {orderNumber}</p>
        )}
      </div>

      {/* Global submit error */}
      {submitError && (
        <div role="alert" className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
          {submitError}
        </div>
      )}

      {/* Quality rating */}
      <div>
        <InteractiveStars value={rating} onChange={setRating} label="Overall Quality Rating *" name="quality" />
        {errors.rating && (
          <p role="alert" className="mt-1 text-xs text-red-600">{errors.rating}</p>
        )}
      </div>

      {/* Fit rating (optional) */}
      <div>
        <InteractiveStars value={fitRating} onChange={setFitRating} label="Fit Rating (optional)" name="fit" />
      </div>

      {/* Title */}
      <div>
        <label htmlFor="review-title" className="block text-sm font-medium text-gray-700 mb-1">
          Review Title (optional)
        </label>
        <input
          id="review-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={200}
          placeholder="Summarise your experience"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-shadow"
          aria-describedby={errors.title ? 'title-error' : undefined}
        />
        {errors.title && (
          <p id="title-error" role="alert" className="mt-1 text-xs text-red-600">{errors.title}</p>
        )}
      </div>

      {/* Body */}
      <div>
        <label htmlFor="review-body" className="block text-sm font-medium text-gray-700 mb-1">
          Review (optional, min 20 characters if provided)
        </label>
        <textarea
          id="review-body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          maxLength={2000}
          rows={5}
          placeholder="Share your experience with this fabric. What did you love? What could be better?"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-shadow resize-none"
          aria-describedby={errors.body ? 'body-error' : undefined}
        />
        <div className="flex justify-between mt-1">
          {errors.body ? (
            <p id="body-error" role="alert" className="text-xs text-red-600">{errors.body}</p>
          ) : (
            <span />
          )}
          <span className="text-xs text-gray-400">{bodyLen} / 2000</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 py-3 px-6 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-800 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Review'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="py-3 px-6 border border-gray-300 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

ReviewForm.propTypes = {
  fabricName: PropTypes.string.isRequired,
  orderNumber: PropTypes.string,
  onSubmit: PropTypes.func.isRequired,
  isSubmitting: PropTypes.bool,
  submitError: PropTypes.string,
  onCancel: PropTypes.func,
};

export default ReviewForm;
