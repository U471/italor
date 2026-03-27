import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import LoginForm from './LoginForm';

// ── Mock the api service ──────────────────────────────────────────────────────
jest.mock('../../services/api', () => ({
  loginUser: jest.fn(),
}));

// ── Mock Zustand authStore ────────────────────────────────────────────────────
const mockSetAuth = jest.fn();
jest.mock('../../store/authStore', () => {
  return {
    __esModule: true,
    default: jest.fn((selector) =>
      selector({ user: null, accessToken: null, setAuth: mockSetAuth, clearAuth: jest.fn() })
    ),
  };
});

// ── Mock react-router-dom navigate ────────────────────────────────────────────
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

import { loginUser } from '../../services/api';

// ── Helpers ───────────────────────────────────────────────────────────────────
function renderForm(props = {}) {
  return render(
    <MemoryRouter>
      <LoginForm {...props} />
    </MemoryRouter>
  );
}

beforeEach(() => {
  jest.clearAllMocks();
});

// ─────────────────────────────────────────────────────────────────────────────
describe('LoginForm', () => {
  // ── TC1: Renders without crashing ────────────────────────────────────────
  it('renders without crashing', () => {
    renderForm();
    expect(screen.getByRole('form', { name: /login form/i })).toBeInTheDocument();
  });

  // ── TC2: Shows email and password fields ─────────────────────────────────
  it('shows email and password fields', () => {
    renderForm();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  // ── TC3: Shows validation errors on empty submit ─────────────────────────
  it('shows validation errors when form is submitted empty', async () => {
    const user = userEvent.setup();
    renderForm();

    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByText(/email is required/i)).toBeInTheDocument();
    expect(screen.getByText(/password is required/i)).toBeInTheDocument();
  });

  it('shows inline error for invalid email format', async () => {
    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByLabelText(/email address/i), 'not-an-email');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByText(/valid email/i)).toBeInTheDocument();
  });

  // ── TC4: Shows loading state on submit ────────────────────────────────────
  it('shows loading state while the API call is in flight', async () => {
    const user = userEvent.setup();

    // Never resolves — keeps loading
    loginUser.mockImplementation(() => new Promise(() => {}));

    renderForm();
    await user.type(screen.getByLabelText(/email address/i), 'jane@example.com');
    await user.type(screen.getByLabelText(/password/i), 'Password1');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByText(/signing in/i)).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeDisabled();
  });

  // ── TC5: Shows error state on wrong credentials (401) ────────────────────
  it('shows error banner when API returns 401', async () => {
    const user = userEvent.setup();

    loginUser.mockRejectedValue(new Error('Invalid email or password'));

    renderForm();
    await user.type(screen.getByLabelText(/email address/i), 'jane@example.com');
    await user.type(screen.getByLabelText(/password/i), 'WrongPass1');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByText(/invalid email or password/i)).toBeInTheDocument();
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  // ── TC6: Calls loginUser API with correct payload ─────────────────────────
  it('calls loginUser with correct email and password payload', async () => {
    const user = userEvent.setup();

    loginUser.mockResolvedValue({
      message: 'Login successful.',
      accessToken: 'test-access-token',
      user: { id: '1', email: 'jane@example.com', firstName: 'Jane', lastName: 'Doe', isVerified: true },
    });

    renderForm();
    await user.type(screen.getByLabelText(/email address/i), 'jane@example.com');
    await user.type(screen.getByLabelText(/password/i), 'Password1');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(loginUser).toHaveBeenCalledTimes(1);
    expect(loginUser).toHaveBeenCalledWith({
      email: 'jane@example.com',
      password: 'Password1',
    });
  });

  it('navigates to /dashboard on successful login', async () => {
    const user = userEvent.setup();
    const onSuccess = jest.fn();

    loginUser.mockResolvedValue({
      message: 'Login successful.',
      accessToken: 'test-access-token',
      user: { id: '1', email: 'jane@example.com', firstName: 'Jane', lastName: 'Doe', isVerified: true },
    });

    renderForm({ onSuccess });
    await user.type(screen.getByLabelText(/email address/i), 'jane@example.com');
    await user.type(screen.getByLabelText(/password/i), 'Password1');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await screen.findByRole('button'); // wait for async settle
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    expect(onSuccess).toHaveBeenCalledTimes(1);
  });

  // ── TC7: "Register" link is present ─────────────────────────────────────
  it('shows "Register" link', () => {
    renderForm();

    const registerLink = screen.getByRole('link', { name: /register/i });
    expect(registerLink).toBeInTheDocument();
    expect(registerLink).toHaveAttribute('href', '/register');
  });
});
