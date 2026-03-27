import { Link } from 'react-router-dom';
import LoginForm from '../components/LoginForm';

/**
 * Login page.
 * Wraps the LoginForm in a centered card layout — identical to RegisterPage.
 */
function LoginPage() {
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
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Sign in to your account</h2>
          <LoginForm />
        </div>
      </div>
    </main>
  );
}

export default LoginPage;
