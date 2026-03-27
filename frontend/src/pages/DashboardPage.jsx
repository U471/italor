import { useNavigate, Link } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { logout as logoutApi } from '../services/api';

/**
 * DashboardPage — protected page shown to authenticated users.
 *
 * Displays a welcome message with the user's name and email.
 * Provides a logout button that clears auth state and redirects to /login.
 *
 * Design matches LoginPage/RegisterPage: bg-gray-50, white card, gray-900 button.
 */
function DashboardPage() {
  const { user, clearAuth } = useAuthStore();
  const navigate = useNavigate();

  const firstName = user?.firstName || 'User';
  const email = user?.email || '';

  async function handleLogout() {
    try {
      await logoutApi();
    } catch {
      // Even if the API call fails, clear local state
    } finally {
      clearAuth();
      navigate('/login', { replace: true });
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Brand */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-serif font-bold text-gray-900 tracking-tight">iTailor</h1>
          <p className="mt-1 text-sm text-gray-500">Custom made-to-measure suits</p>
        </div>

        {/* Card */}
        <div className="bg-white shadow-sm border border-gray-200 rounded-xl px-8 py-10">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            Welcome, {firstName}!
          </h2>

          {email && (
            <p className="text-sm text-gray-500 mb-8">{email}</p>
          )}

          <div className="border-t border-gray-100 pt-6 space-y-3">
            <Link
              to="/account/profile"
              className="block w-full py-3 px-4 text-center bg-brand-600 text-white font-medium rounded-lg hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 transition-colors"
            >
              My Profile
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="w-full py-3 px-4 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

export default DashboardPage;
