import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// ── Mock api ─────────────────────────────────────────────────────────────────
jest.mock('../../services/api', () => ({
  updatePassword: jest.fn(),
}));

import { updatePassword } from '../../services/api';
import ChangePasswordForm from './ChangePasswordForm';

beforeEach(() => {
  jest.clearAllMocks();
});

function renderForm() {
  return render(<ChangePasswordForm />);
}

describe('ChangePasswordForm', () => {
  it('renders without crashing', () => {
    renderForm();
    expect(screen.getByRole('form', { name: /change password form/i })).toBeInTheDocument();
  });

  it('shows all password fields', () => {
    renderForm();
    expect(screen.getByLabelText(/current password/i)).toBeInTheDocument();
    expect(screen.getByLabelText('New password')).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm new password/i)).toBeInTheDocument();
  });

  it('shows validation errors on empty submit', async () => {
    const user = userEvent.setup();
    renderForm();

    await user.click(screen.getByRole('button', { name: /change password/i }));

    expect(await screen.findByText(/current password is required/i)).toBeInTheDocument();
    expect(screen.getByText(/new password is required/i)).toBeInTheDocument();
  });

  it('shows mismatch error when passwords do not match', async () => {
    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByLabelText(/current password/i), 'OldPass1');
    await user.type(screen.getByLabelText('New password'), 'NewPass1');
    await user.type(screen.getByLabelText(/confirm new password/i), 'DifferentPass');
    await user.click(screen.getByRole('button', { name: /change password/i }));

    expect(await screen.findByText(/do not match/i)).toBeInTheDocument();
  });

  it('shows success message on correct submission', async () => {
    const user = userEvent.setup();
    updatePassword.mockResolvedValue({ message: 'Password changed successfully.' });

    renderForm();
    await user.type(screen.getByLabelText(/current password/i), 'OldPass1');
    await user.type(screen.getByLabelText('New password'), 'NewPass1');
    await user.type(screen.getByLabelText(/confirm new password/i), 'NewPass1');
    await user.click(screen.getByRole('button', { name: /change password/i }));

    expect(await screen.findByRole('status')).toHaveTextContent(/changed/i);
  });

  it('shows error alert when API returns error', async () => {
    const user = userEvent.setup();
    updatePassword.mockRejectedValue(new Error('Current password is incorrect'));

    renderForm();
    await user.type(screen.getByLabelText(/current password/i), 'WrongPass');
    await user.type(screen.getByLabelText('New password'), 'NewPass1');
    await user.type(screen.getByLabelText(/confirm new password/i), 'NewPass1');
    await user.click(screen.getByRole('button', { name: /change password/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/current password is incorrect/i);
  });

  it('shows loading state while request is in flight', async () => {
    const user = userEvent.setup();
    updatePassword.mockImplementation(() => new Promise(() => {}));

    renderForm();
    await user.type(screen.getByLabelText(/current password/i), 'OldPass1');
    await user.type(screen.getByLabelText('New password'), 'NewPass1');
    await user.type(screen.getByLabelText(/confirm new password/i), 'NewPass1');
    await user.click(screen.getByRole('button', { name: /change password/i }));

    expect(await screen.findByText(/changing/i)).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('shows length error when new password is too short', async () => {
    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByLabelText(/current password/i), 'OldPass1');
    await user.type(screen.getByLabelText('New password'), 'short');
    await user.type(screen.getByLabelText(/confirm new password/i), 'short');
    await user.click(screen.getByRole('button', { name: /change password/i }));

    expect(await screen.findByText(/at least 8 characters/i)).toBeInTheDocument();
  });
});
