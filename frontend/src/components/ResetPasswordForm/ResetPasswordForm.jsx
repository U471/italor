import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { resetPassword } from '../../services/api';

// Password strength levels — same as RegisterForm
const PASSWORD_LEVELS = [
  { label: 'Weak', color: 'bg-red-500', minScore: 0 },
  { label: 'Fair', color: 'bg-yellow-400', minScore: 1 },
  { label: 'Good', color: 'bg-blue-400', minScore: 2 },
  { label: 'Strong', color: 'bg-green-500', minScore: 3 },
];

function getPasswordScore(password) {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return score;
}

function PasswordStrengthIndicator({ password }) {
  if (!password) return null;
  const score = getPasswordScore(password);
  const level = PASSWORD_LEVELS[Math.min(score, PASSWORD_LEVELS.length - 1)];

  return (
    <div className="mt-2" aria-label={`Password strength: ${level.label}`}>
      <div className="flex gap-1 mb-1">
        {PASSWORD_LEVELS.map((l, i) => (
          <div
            key={l.label}
            className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
              i <= score - 1 ? level.color : 'bg-gray-200'
            }`}
          />
        ))}
      </div>
      <p className="text-xs text-gray-500">
        Password strength: <span className="font-medium">{level.label}</span>
      </p>
    </div>
  );
}

const INITIAL_FORM = { newPassword: '', confirmPassword: '' };
const INITIAL_ERRORS = { newPassword: '', confirmPassword: '' };

/**
 * ResetPasswordForm component.
 *
 * Receives the reset token as a prop (read from URL query by the page).
 * - Validates new password + confirmation.
 * - Shows password strength indicator (same as RegisterForm).
 * - On success: redirects to /login with a success message state.
 * - On invalid/expired token: shows error banner.
 *
 * @param {object} props
 * @param {string} props.token        - Raw reset token from the URL query string.
 * @param {function} [props.onSuccess] - Called on success (for testing).
 */
function ResetPasswordForm({ token, onSuccess }) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState(INITIAL_ERRORS);
  const [apiError, setApiError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
    setApiError('');
  }

  function validate() {
    const newErrors = { ...INITIAL_ERRORS };
    let valid = true;

    if (!form.newPassword) {
      newErrors.newPassword = 'Password is required';
      valid = false;
    } else if (form.newPassword.length < 8) {
      newErrors.newPassword = 'Password must be at least 8 characters';
      valid = false;
    } else if (!/[A-Z]/.test(form.newPassword)) {
      newErrors.newPassword = 'Password must contain at least one uppercase letter';
      valid = false;
    } else if (!/[0-9]/.test(form.newPassword)) {
      newErrors.newPassword = 'Password must contain at least one number';
      valid = false;
    }

    if (!form.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
      valid = false;
    } else if (form.confirmPassword !== form.newPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setApiError('');

    if (!token) {
      setApiError('Invalid or missing reset token. Please request a new password reset link.');
      return;
    }

    if (!validate()) return;

    setIsLoading(true);
    try {
      const result = await resetPassword({ token, newPassword: form.newPassword });
      if (onSuccess) onSuccess(result);
      navigate('/login', { state: { successMessage: 'Password reset successful. You can now sign in with your new password.' } });
    } catch (err) {
      setApiError(err.message || 'Something went wrong. Please try again or request a new reset link.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate aria-label="Reset password form">
      {/* API Error Banner */}
      {apiError && (
        <div
          role="alert"
          className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm"
        >
          {apiError}
        </div>
      )}

      {/* New Password */}
      <div className="mb-4">
        <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
          New password
        </label>
        <input
          id="newPassword"
          name="newPassword"
          type="password"
          autoComplete="new-password"
          value={form.newPassword}
          onChange={handleChange}
          disabled={isLoading}
          aria-invalid={!!errors.newPassword}
          aria-describedby={errors.newPassword ? 'newPassword-error' : undefined}
          className={`w-full px-3 py-2 border rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 transition-colors ${
            errors.newPassword ? 'border-red-500' : 'border-gray-300'
          } disabled:opacity-50`}
          placeholder="Min 8 chars, 1 uppercase, 1 number"
        />
        <PasswordStrengthIndicator password={form.newPassword} />
        {errors.newPassword && (
          <p id="newPassword-error" role="alert" className="mt-1 text-xs text-red-600">
            {errors.newPassword}
          </p>
        )}
      </div>

      {/* Confirm Password */}
      <div className="mb-6">
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
          Confirm new password
        </label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          value={form.confirmPassword}
          onChange={handleChange}
          disabled={isLoading}
          aria-invalid={!!errors.confirmPassword}
          aria-describedby={errors.confirmPassword ? 'confirmPassword-error' : undefined}
          className={`w-full px-3 py-2 border rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 transition-colors ${
            errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
          } disabled:opacity-50`}
          placeholder="Repeat your new password"
        />
        {errors.confirmPassword && (
          <p id="confirmPassword-error" role="alert" className="mt-1 text-xs text-red-600">
            {errors.confirmPassword}
          </p>
        )}
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isLoading}
        aria-busy={isLoading}
        className="w-full py-3 px-4 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <svg
              className="animate-spin h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            Resetting password…
          </span>
        ) : (
          'Reset password'
        )}
      </button>
    </form>
  );
}

export default ResetPasswordForm;
