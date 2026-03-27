import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import DashboardPage from './DashboardPage';

// ── Mock authStore ────────────────────────────────────────────────────────────
// DashboardPage calls useAuthStore() with no selector — returns full state.
const mockClearAuth = jest.fn();

jest.mock('../store/authStore', () => {
  return {
    __esModule: true,
    default: jest.fn(),
  };
});

import useAuthStore from '../store/authStore';

// ── Mock API (auto-mocked via moduleNameMapper) ───────────────────────────────
import { logout } from '../services/api';

// ── Helpers ───────────────────────────────────────────────────────────────────

function renderDashboard(user = { firstName: 'Jane', email: 'jane@example.com' }) {
  useAuthStore.mockReturnValue({ user, clearAuth: mockClearAuth });

  return render(
    <MemoryRouter initialEntries={['/dashboard']}>
      <Routes>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/login" element={<div>Login Page</div>} />
      </Routes>
    </MemoryRouter>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
describe('DashboardPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    logout.mockResolvedValue({ message: 'Logged out' });
  });

  // ── Welcome message ─────────────────────────────────────────────────────────
  describe('welcome message', () => {
    it('renders welcome heading with user first name', () => {
      renderDashboard({ firstName: 'Jane', email: 'jane@example.com' });

      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Welcome, Jane!');
    });

    it('renders the user email', () => {
      renderDashboard({ firstName: 'Jane', email: 'jane@example.com' });

      expect(screen.getByText('jane@example.com')).toBeInTheDocument();
    });

    it('renders "Welcome, User!" when user is null', () => {
      renderDashboard(null);

      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Welcome, User!');
    });
  });

  // ── Logout button ───────────────────────────────────────────────────────────
  describe('logout button', () => {
    it('renders a sign out button', () => {
      renderDashboard();

      expect(screen.getByRole('button', { name: /sign out/i })).toBeInTheDocument();
    });

    it('calls logout API and clearAuth when sign out is clicked', async () => {
      renderDashboard();

      fireEvent.click(screen.getByRole('button', { name: /sign out/i }));

      await waitFor(() => {
        expect(logout).toHaveBeenCalledTimes(1);
        expect(mockClearAuth).toHaveBeenCalledTimes(1);
      });
    });

    it('redirects to /login after logout', async () => {
      renderDashboard();

      fireEvent.click(screen.getByRole('button', { name: /sign out/i }));

      await waitFor(() => {
        expect(screen.getByText('Login Page')).toBeInTheDocument();
      });
    });

    it('still calls clearAuth and redirects even when logout API throws', async () => {
      logout.mockRejectedValue(new Error('Network error'));

      renderDashboard();

      fireEvent.click(screen.getByRole('button', { name: /sign out/i }));

      await waitFor(() => {
        expect(mockClearAuth).toHaveBeenCalledTimes(1);
        expect(screen.getByText('Login Page')).toBeInTheDocument();
      });
    });
  });
});
