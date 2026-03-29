import { Routes, Route } from 'react-router-dom';
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/ProfilePage';
import FabricCatalogPage from './pages/FabricCatalogPage';
import FabricDetailPage from './pages/FabricDetailPage';
import AdminFabricPage from './pages/admin/AdminFabricPage';
import BuilderPage from './pages/BuilderPage';
import MyDesignsPage from './pages/MyDesignsPage';
import MyMeasurementsPage from './pages/MyMeasurementsPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import OrderConfirmationPage from './pages/OrderConfirmationPage';
import FeaturedFabrics from './components/FeaturedFabrics/FeaturedFabrics';
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
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute isLoading={isLoading}>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/account/profile"
          element={
            <ProtectedRoute isLoading={isLoading}>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route path="/cart" element={<CartPage />} />
        <Route
          path="/checkout"
          element={
            <ProtectedRoute isLoading={isLoading}>
              <CheckoutPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/orders/:orderId/confirmation"
          element={
            <ProtectedRoute isLoading={isLoading}>
              <OrderConfirmationPage />
            </ProtectedRoute>
          }
        />
        <Route path="/fabrics" element={<FabricCatalogPage />} />
        <Route path="/fabrics/:id" element={<FabricDetailPage />} />
        <Route path="/builder" element={<BuilderPage />} />
        <Route
          path="/account/designs"
          element={
            <ProtectedRoute isLoading={isLoading}>
              <MyDesignsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/account/measurements"
          element={
            <ProtectedRoute isLoading={isLoading}>
              <MyMeasurementsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/fabrics"
          element={
            <ProtectedRoute isLoading={isLoading}>
              <AdminFabricPage />
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
    <main>
      {/* Hero */}
      <section className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center bg-gray-50">
        <h1 className="text-4xl font-serif font-bold text-gray-900 mb-4">
          iTailor
        </h1>
        <p className="text-lg text-gray-600 max-w-md mb-8">
          Custom made-to-measure suits, delivered to your door.
        </p>
        <a
          href="/fabrics"
          className="px-8 py-3 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 transition-colors"
        >
          Explore Fabrics
        </a>
      </section>

      {/* Featured fabrics */}
      <FeaturedFabrics />
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
