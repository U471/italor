import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import ForgotPasswordForm from './ForgotPasswordForm';

// ── Mock the api service ──────────────────────────────────────────────────────
jest.mock('../../services/api', () => ({
  forgotPassword: jest.fn(),
}));

import { forgotPassword } from '../../services/api';

// ── Helpers ───────────────────────────────────────────────────────────────────
function renderForm(props = {}) {
  return render(
    <MemoryRouter>
      <ForgotPasswordForm {...props} />
    </MemoryRouter>
  );
}

beforeEach(() => {
  jest.clearAllMocks();
});

// ─────────────────────────────────────────────────────────────────────────────
describe('ForgotPasswordForm', () => {
  // ── TC1: Renders without crashing ────────────────────────────────────────
  it('renders without crashing', () => {
    renderForm();
    expect(screen.getByRole('form', { name: /forgot password form/i })).toBeInTheDocument();
  });

  it('shows the email field and submit button', () => {
    renderForm();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send reset link/i })).toBeInTheDocument();
  });

  // ── TC2: Validates empty email ────────────────────────────────────────────
  it('shows validation error when form is submitted with empty email', async () => {
    const user = userEvent.setup();
    renderForm();

    await user.click(screen.getByRole('button', { name: /send reset link/i }));

    expect(await screen.findByText(/email is required/i)).toBeInTheDocument();
  });

  it('shows validation error for invalid email format', async () => {
    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByLabelText(/email address/i), 'not-an-email');
    await user.click(screen.getByRole('button', { name: /send reset link/i }));

    expect(await screen.findByText(/valid email/i)).toBeInTheDocument();
  });

  // ── TC3: Shows loading state on submit ────────────────────────────────────
  it('shows loading state while the API call is in flight', async () => {
    const user = userEvent.setup();

    // Never resolves — keeps loading
    forgotPassword.mockImplementation(() => new Promise(() => {}));

    renderForm();
    await user.type(screen.getByLabelText(/email address/i), 'jane@example.com');
    await user.click(screen.getByRole('button', { name: /send reset link/i }));

    expect(await screen.findByText(/sending/i)).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeDisabled();
  });

  // ── TC4: Shows success state after successful submit ──────────────────────
  it('shows success state after a successful API call', async () => {
    const user = userEvent.setup();
    const onSuccess = jest.fn();

    forgotPassword.mockResolvedValue({
      message: 'If an account with that email exists, we have sent a password reset link.',
    });

    renderForm({ onSuccess });
    await user.type(screen.getByLabelText(/email address/i), 'jane@example.com');
    await user.click(screen.getByRole('button', { name: /send reset link/i }));

    expect(await screen.findByRole('status')).toBeInTheDocument();
    expect(screen.getByText(/check your email/i)).toBeInTheDocument();
    expect(onSuccess).toHaveBeenCalledTimes(1);
  });

  it('calls forgotPassword with the trimmed email', async () => {
    const user = userEvent.setup();

    forgotPassword.mockResolvedValue({ message: 'ok' });

    renderForm();
    await user.type(screen.getByLabelText(/email address/i), '  jane@example.com  ');
    await user.click(screen.getByRole('button', { name: /send reset link/i }));

    await screen.findByRole('status');
    expect(forgotPassword).toHaveBeenCalledWith({ email: 'jane@example.com' });
  });

  // ── TC5: Shows API error on failure ──────────────────────────────────────
  it('shows an error banner when the API call fails', async () => {
    const user = userEvent.setup();

    forgotPassword.mockRejectedValue(new Error('Network error'));

    renderForm();
    await user.type(screen.getByLabelText(/email address/i), 'jane@example.com');
    await user.click(screen.getByRole('button', { name: /send reset link/i }));

    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(/network error/i)).toBeInTheDocument();
  });
});
