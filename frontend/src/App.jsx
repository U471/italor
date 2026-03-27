import { Routes, Route } from 'react-router-dom';
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';

/**
 * Root application component.
 * Routes are added here as features are built sprint by sprint.
 */
function App() {
  return (
    <div className="min-h-screen bg-white">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />
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
