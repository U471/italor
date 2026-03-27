import { useNavigate, Link } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { logout as logoutApi } from '../services/api';
import ProfileForm from '../components/ProfileForm/ProfileForm';
import ChangePasswordForm from '../components/ChangePasswordForm/ChangePasswordForm';
import AvatarUpload from '../components/AvatarUpload/AvatarUpload';

/**
 * ProfilePage — /account/profile
 *
 * Protected page for managing the authenticated user's profile:
 *   - Avatar upload
 *   - First name, last name, phone update
 *   - Password change
 *
 * Design is consistent with DashboardPage / LoginPage card pattern.
 */
function ProfilePage() {
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const navigate = useNavigate();

  async function handleLogout() {
    try {
      await logoutApi();
    } catch {
      // clear local state regardless
    } finally {
      clearAuth();
      navigate('/login', { replace: true });
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-2xl">
        {/* Brand + nav */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-serif font-bold text-gray-900 tracking-tight">iTailor</h1>
            <p className="mt-0.5 text-sm text-gray-500">Custom made-to-measure suits</p>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="text-sm text-brand-600 hover:text-brand-700 font-medium">
              Dashboard
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Sign out
            </button>
          </div>
        </div>

        <h2 className="text-2xl font-semibold text-gray-900 mb-6">My Profile</h2>

        {/* Avatar card */}
        <div className="bg-white shadow-sm border border-gray-200 rounded-xl px-8 py-8 mb-6">
          <AvatarUpload />
        </div>

        {/* Profile info card */}
        <div className="bg-white shadow-sm border border-gray-200 rounded-xl px-8 py-8 mb-6">
          <ProfileForm />
        </div>

        {/* Change password card */}
        <div className="bg-white shadow-sm border border-gray-200 rounded-xl px-8 py-8">
          <ChangePasswordForm />
        </div>
      </div>
    </main>
  );
}

export default ProfilePage;
