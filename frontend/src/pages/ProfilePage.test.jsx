import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

// ── Mock api ─────────────────────────────────────────────────────────────────
jest.mock('../services/api', () => ({
  logout: jest.fn(),
  updateMe: jest.fn(),
  updatePassword: jest.fn(),
  updateAvatar: jest.fn(),
}));

// ── Mock Zustand authStore ────────────────────────────────────────────────────
const mockClearAuth = jest.fn();
const mockSetAuth = jest.fn();
jest.mock('../store/authStore', () => ({
  __esModule: true,
  default: jest.fn(),
}));

// ── Mock navigate ─────────────────────────────────────────────────────────────
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

globalThis.URL.createObjectURL = jest.fn(() => 'blob:mock-url');

import useAuthStore from '../store/authStore';
import { logout } from '../services/api';
import ProfilePage from './ProfilePage';

const MOCK_STATE = {
  user: { firstName: 'Jane', lastName: 'Doe', email: 'jane@example.com', phone: '', avatarUrl: null },
  accessToken: 'test-token',
  setAuth: mockSetAuth,
  clearAuth: mockClearAuth,
};

beforeEach(() => {
  jest.clearAllMocks();
  useAuthStore.mockImplementation((selector) => selector(MOCK_STATE));
});

function renderPage() {
  return render(
    <MemoryRouter>
      <ProfilePage />
    </MemoryRouter>
  );
}

describe('ProfilePage', () => {
  it('renders without crashing', () => {
    renderPage();
    expect(screen.getByText('My Profile')).toBeInTheDocument();
  });

  it('shows profile form and change password form', () => {
    renderPage();
    expect(screen.getByRole('form', { name: /profile form/i })).toBeInTheDocument();
    expect(screen.getByRole('form', { name: /change password form/i })).toBeInTheDocument();
  });

  it('shows Dashboard link and Sign out button', () => {
    renderPage();
    expect(screen.getByRole('link', { name: /dashboard/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign out/i })).toBeInTheDocument();
  });

  it('logs out and navigates to /login on sign out', async () => {
    const user = userEvent.setup();
    logout.mockResolvedValue({});

    renderPage();
    await user.click(screen.getByRole('button', { name: /sign out/i }));

    expect(mockClearAuth).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true });
  });

  it('shows avatar upload button', () => {
    renderPage();
    expect(screen.getByRole('button', { name: /upload avatar/i })).toBeInTheDocument();
  });
});
