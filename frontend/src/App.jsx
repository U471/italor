import { Routes, Route } from 'react-router-dom';
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ProtectedRoute from './components/ProtectedRoute';
import useAuth from './hooks/useAuth';

/**
 * Root application component.
 * Routes are added here as features are built sprint by sprint.
 *
 * useAuth hook is called at the root level so that session restore
 * (silent refresh) happens on every page load, preventing a flash of
 * unauthenticated content when the user has a valid refresh token cookie.
 */
function App() {
  const { isLoading } = useAuth();

  return (
    <div className="min-h-screen bg-white">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute isLoading={isLoading}>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </div>
  );
}

function HomePage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen px-4 text-center">
      <h1 className="text-4xl font-serif font-bold text-gray-900 mb-4">
        iTailor
      </h1>
      <p className="text-lg text-gray-600 max-w-md">
        Custom made-to-measure suits, delivered to your door.
      </p>
    </main>
  );
}

function NotFoundPage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen px-4 text-center">
      <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
      <p className="text-lg text-gray-600 mb-8">Page not found.</p>
      <a
        href="/"
        className="px-6 py-3 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors"
      >
        Go home
      </a>
    </main>
  );
}

export default App;
