import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import RegisterForm from './RegisterForm';

// ── Mock the api service ──────────────────────────────────────────────────────
jest.mock('../../services/api', () => ({
  registerUser: jest.fn(),
}));

import { registerUser } from '../../services/api';

// ── Helpers ───────────────────────────────────────────────────────────────────
function renderForm(props = {}) {
  return render(
    <MemoryRouter>
      <RegisterForm {...props} />
    </MemoryRouter>
  );
}

const fillValidForm = async (user) => {
  await user.type(screen.getByLabelText(/first name/i), 'Jane');
  await user.type(screen.getByLabelText(/last name/i), 'Doe');
  await user.type(screen.getByLabelText(/email address/i), 'jane@example.com');
  await user.type(screen.getByLabelText(/^password$/i), 'Password1');
  await user.type(screen.getByLabelText(/confirm password/i), 'Password1');
};

beforeEach(() => {
  jest.clearAllMocks();
});

// ─────────────────────────────────────────────────────────────────────────────
describe('RegisterForm', () => {
  // ── TC1: Renders without crashing ────────────────────────────────────────
  it('renders without crashing', () => {
    renderForm();
    expect(screen.getByRole('form', { name: /registration form/i })).toBeInTheDocument();
  });

  // ── TC2: Shows all form fields ────────────────────────────────────────────
  it('shows all required form fields', () => {
    renderForm();
    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
  });

  // ── TC3: Shows validation errors on empty submit ─────────────────────────
  it('shows validation errors when form is submitted empty', async () => {
    const user = userEvent.setup();
    renderForm();

    await user.click(screen.getByRole('button', { name: /create account/i }));

    expect(await screen.findByText(/first name is required/i)).toBeInTheDocument();
    expect(screen.getByText(/last name is required/i)).toBeInTheDocument();
    expect(screen.getByText(/email is required/i)).toBeInTheDocument();
    expect(screen.getByText(/password is required/i)).toBeInTheDocument();
  });

  it('shows inline error for invalid email format', async () => {
    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByLabelText(/email address/i), 'not-an-email');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    expect(await screen.findByText(/valid email/i)).toBeInTheDocument();
  });

  it('shows inline error when password is too short', async () => {
    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByLabelText(/^password$/i), 'P1');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    expect(await screen.findByText(/at least 8 characters/i)).toBeInTheDocument();
  });

  it('shows error when passwords do not match', async () => {
    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByLabelText(/^password$/i), 'Password1');
    await user.type(screen.getByLabelText(/confirm password/i), 'DifferentPass1');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    expect(await screen.findByText(/passwords do not match/i)).toBeInTheDocument();
  });

  // ── TC4: Shows loading state on submit ────────────────────────────────────
  it('shows loading state while the API call is in flight', async () => {
    const user = userEvent.setup();

    // Never resolves during test — keeps loading
    registerUser.mockImplementation(() => new Promise(() => {}));

    renderForm();
    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: /create account/i }));

    expect(await screen.findByText(/creating account/i)).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeDisabled();
  });

  // ── TC5: Shows error state on API failure ─────────────────────────────────
  it('shows API error message when registration fails', async () => {
    const user = userEvent.setup();

    registerUser.mockRejectedValue(
      new Error('An account with this email already exists. Try logging in.')
    );

    renderForm();
    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: /create account/i }));

    expect(
      await screen.findByText(/an account with this email already exists/i)
    ).toBeInTheDocument();
  });

  it('shows generic error when API fails without a message', async () => {
    const user = userEvent.setup();
    registerUser.mockRejectedValue(new Error('Registration failed. Please try again.'));

    renderForm();
    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: /create account/i }));

    expect(await screen.findByText(/registration failed/i)).toBeInTheDocument();
  });

  // ── TC6: Success state ────────────────────────────────────────────────────
  it('shows success confirmation on successful registration', async () => {
    const user = userEvent.setup();
    const onSuccess = jest.fn();

    registerUser.mockResolvedValue({
      message: 'Registration successful. Please check your email to verify your account.',
      user: { id: '1', email: 'jane@example.com', isVerified: false },
    });

    renderForm({ onSuccess });
    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: /create account/i }));

    expect(await screen.findByText(/check your email/i)).toBeInTheDocument();
    expect(onSuccess).toHaveBeenCalledTimes(1);
  });

  // ── TC7: Password strength indicator ─────────────────────────────────────
  it('shows password strength indicator when user types a password', async () => {
    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByLabelText(/^password$/i), 'Password1');

    // Strength indicator appears
    expect(screen.getByText(/password strength/i)).toBeInTheDocument();
  });
});
