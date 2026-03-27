import { Link, useSearchParams } from 'react-router-dom';
import ResetPasswordForm from '../components/ResetPasswordForm';

/**
 * Reset Password page.
 * Reads the reset token from the URL query string (?token=...) and passes it to ResetPasswordForm.
 * Wraps the form in a centered card layout — identical to LoginPage/RegisterPage.
 */
function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Logo / Brand */}
        <Link to="/" className="block text-center mb-8">
          <h1 className="text-3xl font-serif font-bold text-gray-900 tracking-tight">iTailor</h1>
          <p className="mt-1 text-sm text-gray-500">Custom made-to-measure suits</p>
        </Link>

        {/* Card */}
        <div className="bg-white shadow-sm border border-gray-200 rounded-xl px-8 py-10">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Set a new password</h2>
          <ResetPasswordForm token={token} />
          <p className="mt-6 text-center text-sm text-gray-500">
            Back to{' '}
            <Link to="/login" className="font-medium text-gray-900 hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}

export default ResetPasswordPage;
