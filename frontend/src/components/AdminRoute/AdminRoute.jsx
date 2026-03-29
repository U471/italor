import { Navigate, useLocation } from 'react-router-dom';
import useAuthStore from '../../store/authStore';

/**
 * AdminRoute component.
 *
 * Wraps routes that require the 'admin' role.
 * - If unauthenticated → redirects to /login (with return path in state).
 * - If authenticated but not admin → redirects to /403.
 * - If admin → renders children.
 *
 * @param {{ children: React.ReactNode, isLoading?: boolean }} props
 */
function AdminRoute({ children, isLoading = false }) {
  const { accessToken, user } = useAuthStore((state) => ({
    accessToken: state.accessToken,
    user: state.user,
  }));
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <svg className="animate-spin h-8 w-8 text-gray-900" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  if (!accessToken) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (user?.role !== 'admin') {
    return <Navigate to="/403" replace />;
  }

  return children;
}

export default AdminRoute;
