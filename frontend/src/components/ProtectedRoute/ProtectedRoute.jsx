import { Navigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';

/**
 * ProtectedRoute component.
 *
 * Wraps routes that require authentication.
 * - If authenticated (accessToken present in store) → renders children.
 * - If not authenticated → redirects to /login.
 *
 * Note: isLoading state is handled at the App level via useAuth hook
 * to prevent flash of unauthenticated content on page refresh.
 *
 * @param {{ children: React.ReactNode, isLoading?: boolean }} props
 */
function ProtectedRoute({ children, isLoading = false }) {
  const accessToken = useAuthStore((state) => state.accessToken);

  // Show nothing while checking auth to prevent flash
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <svg
            className="animate-spin h-8 w-8 text-gray-900"
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
          <p className="text-sm text-gray-500">Loading…</p>
        </div>
      </div>
    );
  }

  if (!accessToken) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default ProtectedRoute;
