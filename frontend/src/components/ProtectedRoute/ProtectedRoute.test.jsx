import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';

// ── Mock authStore ────────────────────────────────────────────────────────────
// ProtectedRoute calls useAuthStore((state) => state.accessToken) — selector pattern.
jest.mock('../../store/authStore', () => {
  return {
    __esModule: true,
    default: jest.fn(),
  };
});

import useAuthStore from '../../store/authStore';

// ─────────────────────────────────────────────────────────────────────────────
describe('ProtectedRoute', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── Authenticated ───────────────────────────────────────────────────────────
  describe('when authenticated', () => {
    it('renders children when accessToken is present', () => {
      // Selector is called with full state — return the token value
      useAuthStore.mockImplementation((selector) =>
        selector({ accessToken: 'valid-token-abc' })
      );

      render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <Routes>
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <div>Protected Content</div>
                </ProtectedRoute>
              }
            />
            <Route path="/login" element={<div>Login Page</div>} />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
      expect(screen.queryByText('Login Page')).not.toBeInTheDocument();
    });
  });

  // ── Unauthenticated ─────────────────────────────────────────────────────────
  describe('when not authenticated', () => {
    it('redirects to /login when accessToken is null', () => {
      useAuthStore.mockImplementation((selector) =>
        selector({ accessToken: null })
      );

      render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <Routes>
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <div>Protected Content</div>
                </ProtectedRoute>
              }
            />
            <Route path="/login" element={<div>Login Page</div>} />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
      expect(screen.getByText('Login Page')).toBeInTheDocument();
    });

    it('shows loading spinner when isLoading is true', () => {
      useAuthStore.mockImplementation((selector) =>
        selector({ accessToken: null })
      );

      render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <Routes>
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute isLoading={true}>
                  <div>Protected Content</div>
                </ProtectedRoute>
              }
            />
            <Route path="/login" element={<div>Login Page</div>} />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByText('Loading…')).toBeInTheDocument();
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
      expect(screen.queryByText('Login Page')).not.toBeInTheDocument();
    });
  });
});
