import { useState } from 'react';
import { registerUser } from '../../services/api';

// Password strength levels
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

const INITIAL_FORM = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  confirmPassword: '',
};

const INITIAL_ERRORS = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  confirmPassword: '',
};

/**
 * RegisterForm component.
 *
 * Displays a registration form with client-side validation, password strength
 * indicator, loading state, error state, and success state.
 *
 * @param {object} props
 * @param {function} [props.onSuccess] - Called with the API response on success.
 */
function RegisterForm({ onSuccess }) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState(INITIAL_ERRORS);
  const [apiError, setApiError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    // Clear field error on change
    setErrors((prev) => ({ ...prev, [name]: '' }));
    setApiError('');
  }

  function validate() {
    const newErrors = { ...INITIAL_ERRORS };
    let valid = true;

    if (!form.firstName.trim()) {
      newErrors.firstName = 'First name is required';
      valid = false;
    }
    if (!form.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
      valid = false;
    }
    if (!form.email.trim()) {
      newErrors.email = 'Email is required';
      valid = false;
    } else if (!/^\S+@\S+\.\S+$/.test(form.email)) {
      newErrors.email = 'Please enter a valid email address';
      valid = false;
    }
    if (!form.password) {
      newErrors.password = 'Password is required';
      valid = false;
    } else if (form.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
      valid = false;
    } else if (!/[A-Z]/.test(form.password)) {
      newErrors.password = 'Password must contain at least one uppercase letter';
      valid = false;
    } else if (!/[0-9]/.test(form.password)) {
      newErrors.password = 'Password must contain at least one number';
      valid = false;
    }
    if (!form.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
      valid = false;
    } else if (form.confirmPassword !== form.password) {
      newErrors.confirmPassword = 'Passwords do not match';
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setApiError('');

    if (!validate()) return;

    setIsLoading(true);
    try {
      const result = await registerUser({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        password: form.password,
        confirmPassword: form.confirmPassword,
      });
      setIsSuccess(true);
      if (onSuccess) onSuccess(result);
    } catch (err) {
      setApiError(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  // ── Success state ─────────────────────────────────────────────────────────
  if (isSuccess) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="text-center p-8"
      >
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-8 h-8 text-green-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Check your email</h2>
        <p className="text-gray-600">
          We&apos;ve sent a verification link to <strong>{form.email}</strong>. Click the link to
          activate your account.
        </p>
      </div>
    );
  }

  // ── Form ─────────────────────────────────────────────────────────────────
  return (
    <form onSubmit={handleSubmit} noValidate aria-label="Registration form">
      {/* API Error Banner */}
      {apiError && (
        <div
          role="alert"
          className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm"
        >
          {apiError}
        </div>
      )}

      {/* Name row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div>
          <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
            First name
          </label>
          <input
            id="firstName"
            name="firstName"
            type="text"
            autoComplete="given-name"
            value={form.firstName}
            onChange={handleChange}
            disabled={isLoading}
            aria-invalid={!!errors.firstName}
            aria-describedby={errors.firstName ? 'firstName-error' : undefined}
            className={`w-full px-3 py-2 border rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 transition-colors ${
              errors.firstName ? 'border-red-500' : 'border-gray-300'
            } disabled:opacity-50`}
            placeholder="Jane"
          />
          {errors.firstName && (
            <p id="firstName-error" role="alert" className="mt-1 text-xs text-red-600">
              {errors.firstName}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
            Last name
          </label>
          <input
            id="lastName"
            name="lastName"
            type="text"
            autoComplete="family-name"
            value={form.lastName}
            onChange={handleChange}
            disabled={isLoading}
            aria-invalid={!!errors.lastName}
            aria-describedby={errors.lastName ? 'lastName-error' : undefined}
            className={`w-full px-3 py-2 border rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 transition-colors ${
              errors.lastName ? 'border-red-500' : 'border-gray-300'
            } disabled:opacity-50`}
            placeholder="Doe"
          />
          {errors.lastName && (
            <p id="lastName-error" role="alert" className="mt-1 text-xs text-red-600">
              {errors.lastName}
            </p>
          )}
        </div>
      </div>

      {/* Email */}
      <div className="mb-4">
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
          Email address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          value={form.email}
          onChange={handleChange}
          disabled={isLoading}
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? 'email-error' : undefined}
          className={`w-full px-3 py-2 border rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 transition-colors ${
            errors.email ? 'border-red-500' : 'border-gray-300'
          } disabled:opacity-50`}
          placeholder="jane@example.com"
        />
        {errors.email && (
          <p id="email-error" role="alert" className="mt-1 text-xs text-red-600">
            {errors.email}
          </p>
        )}
      </div>

      {/* Password */}
      <div className="mb-4">
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          value={form.password}
          onChange={handleChange}
          disabled={isLoading}
          aria-invalid={!!errors.password}
          aria-describedby={errors.password ? 'password-error' : undefined}
          className={`w-full px-3 py-2 border rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 transition-colors ${
            errors.password ? 'border-red-500' : 'border-gray-300'
          } disabled:opacity-50`}
          placeholder="Min 8 chars, 1 uppercase, 1 number"
        />
        <PasswordStrengthIndicator password={form.password} />
        {errors.password && (
          <p id="password-error" role="alert" className="mt-1 text-xs text-red-600">
            {errors.password}
          </p>
        )}
      </div>

      {/* Confirm password */}
      <div className="mb-6">
        <label
          htmlFor="confirmPassword"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Confirm password
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
          placeholder="Repeat your password"
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
            Creating account…
          </span>
        ) : (
          'Create account'
        )}
      </button>
    </form>
  );
}

export default RegisterForm;
