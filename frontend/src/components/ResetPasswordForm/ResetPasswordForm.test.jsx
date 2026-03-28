import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import ResetPasswordForm from './ResetPasswordForm';

// ── Mock the api service ──────────────────────────────────────────────────────
jest.mock('../../services/api', () => ({
  resetPassword: jest.fn(),
}));

// ── Mock react-router-dom navigate ────────────────────────────────────────────
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

import { resetPassword } from '../../services/api';

const VALID_TOKEN = 'a'.repeat(64);
const VALID_PASSWORD = 'NewPassword1';

// ── Helpers ───────────────────────────────────────────────────────────────────
function renderForm(props = {}) {
  return render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ResetPasswordForm token={VALID_TOKEN} {...props} />
    </MemoryRouter>
  );
}

beforeEach(() => {
  jest.clearAllMocks();
});

// ─────────────────────────────────────────────────────────────────────────────
describe('ResetPasswordForm', () => {
  // ── TC1: Renders ──────────────────────────────────────────────────────────
  it('renders without crashing', () => {
    renderForm();
    expect(screen.getByRole('form', { name: /reset password form/i })).toBeInTheDocument();
  });

  it('shows new password and confirm password fields', () => {
    renderForm();
    expect(screen.getByLabelText(/^new password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm new password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reset password/i })).toBeInTheDocument();
  });

  // ── TC2: Validates password rules ─────────────────────────────────────────
  it('shows validation error when new password is missing', async () => {
    const user = userEvent.setup();
    renderForm();

    await user.click(screen.getByRole('button', { name: /reset password/i }));

    expect(await screen.findByText(/password is required/i)).toBeInTheDocument();
  });

  it('shows validation error when password is too short', async () => {
    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByLabelText(/^new password$/i), 'Pass1');
    await user.click(screen.getByRole('button', { name: /reset password/i }));

    expect(await screen.findByText(/at least 8 characters/i)).toBeInTheDocument();
  });

  it('shows validation error when password has no uppercase letter', async () => {
    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByLabelText(/^new password$/i), 'password1');
    await user.click(screen.getByRole('button', { name: /reset password/i }));

    expect(await screen.findByText(/uppercase/i)).toBeInTheDocument();
  });

  it('shows validation error when password has no number', async () => {
    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByLabelText(/^new password$/i), 'Passwords');
    await user.click(screen.getByRole('button', { name: /reset password/i }));

    expect(await screen.findByText(/at least one number/i)).toBeInTheDocument();
  });

  it('shows validation error when passwords do not match', async () => {
    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByLabelText(/^new password$/i), VALID_PASSWORD);
    await user.type(screen.getByLabelText(/confirm new password/i), 'DifferentPass1');
    await user.click(screen.getByRole('button', { name: /reset password/i }));

    expect(await screen.findByText(/do not match/i)).toBeInTheDocument();
  });

  // ── TC3: Shows loading state ───────────────────────────────────────────────
  it('shows loading state while the API call is in flight', async () => {
    const user = userEvent.setup();

    resetPassword.mockImplementation(() => new Promise(() => {}));

    renderForm();
    await user.type(screen.getByLabelText(/^new password$/i), VALID_PASSWORD);
    await user.type(screen.getByLabelText(/confirm new password/i), VALID_PASSWORD);
    await user.click(screen.getByRole('button', { name: /reset password/i }));

    expect(await screen.findByText(/resetting password/i)).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeDisabled();
  });

  // ── TC4: Shows password strength indicator ────────────────────────────────
  it('shows the password strength indicator when user types a password', async () => {
    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByLabelText(/^new password$/i), VALID_PASSWORD);

    expect(screen.getByText(/password strength/i)).toBeInTheDocument();
  });

  // ── TC5: Navigates to /login on success ──────────────────────────────────
  it('navigates to /login with success message state after successful reset', async () => {
    const user = userEvent.setup();
    const onSuccess = jest.fn();

    resetPassword.mockResolvedValue({ message: 'Your password has been reset successfully.' });

    renderForm({ onSuccess });
    await user.type(screen.getByLabelText(/^new password$/i), VALID_PASSWORD);
    await user.type(screen.getByLabelText(/confirm new password/i), VALID_PASSWORD);
    await user.click(screen.getByRole('button', { name: /reset password/i }));

    await screen.findByRole('button'); // wait for async settle
    expect(mockNavigate).toHaveBeenCalledWith('/login', expect.objectContaining({ state: expect.objectContaining({ successMessage: expect.any(String) }) }));
    expect(onSuccess).toHaveBeenCalledTimes(1);
  });

  // ── TC6: Shows error banner for invalid/expired token ────────────────────
  it('shows an error banner when the token is invalid or expired', async () => {
    const user = userEvent.setup();

    resetPassword.mockRejectedValue(new Error('This reset link has expired. Please request a new one.'));

    renderForm();
    await user.type(screen.getByLabelText(/^new password$/i), VALID_PASSWORD);
    await user.type(screen.getByLabelText(/confirm new password/i), VALID_PASSWORD);
    await user.click(screen.getByRole('button', { name: /reset password/i }));

    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(/expired/i)).toBeInTheDocument();
  });

  it('shows error banner when no token is provided', async () => {
    const user = userEvent.setup();

    renderForm({ token: '' });
    await user.type(screen.getByLabelText(/^new password$/i), VALID_PASSWORD);
    await user.type(screen.getByLabelText(/confirm new password/i), VALID_PASSWORD);
    await user.click(screen.getByRole('button', { name: /reset password/i }));

    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(/invalid or missing reset token/i)).toBeInTheDocument();
  });
});
