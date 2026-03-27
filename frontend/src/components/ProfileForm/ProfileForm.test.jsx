import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// ── Mock api ─────────────────────────────────────────────────────────────────
jest.mock('../../services/api', () => ({
  updateMe: jest.fn(),
}));

// ── Mock Zustand authStore ────────────────────────────────────────────────────
const mockSetAuth = jest.fn();
jest.mock('../../store/authStore', () => ({
  __esModule: true,
  default: jest.fn((selector) =>
    selector({
      user: { firstName: 'Jane', lastName: 'Doe', email: 'jane@example.com', phone: '' },
      accessToken: 'test-token',
      setAuth: mockSetAuth,
    })
  ),
}));

import { updateMe } from '../../services/api';
import ProfileForm from './ProfileForm';

beforeEach(() => {
  jest.clearAllMocks();
});

function renderForm() {
  return render(<ProfileForm />);
}

describe('ProfileForm', () => {
  it('renders without crashing', () => {
    renderForm();
    expect(screen.getByRole('form', { name: /profile form/i })).toBeInTheDocument();
  });

  it('shows pre-filled user values', () => {
    renderForm();
    expect(screen.getByLabelText(/first name/i)).toHaveValue('Jane');
    expect(screen.getByLabelText(/last name/i)).toHaveValue('Doe');
  });

  it('shows success message on save', async () => {
    const user = userEvent.setup();
    updateMe.mockResolvedValue({
      message: 'Profile updated successfully.',
      user: { firstName: 'Janet', lastName: 'Doe', email: 'jane@example.com', phone: '' },
    });

    renderForm();
    await user.clear(screen.getByLabelText(/first name/i));
    await user.type(screen.getByLabelText(/first name/i), 'Janet');
    await user.click(screen.getByRole('button', { name: /save changes/i }));

    expect(await screen.findByRole('status')).toHaveTextContent(/updated/i);
    expect(mockSetAuth).toHaveBeenCalled();
  });

  it('shows error message when update fails', async () => {
    const user = userEvent.setup();
    updateMe.mockRejectedValue(new Error('Server error'));

    renderForm();
    await user.click(screen.getByRole('button', { name: /save changes/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/server error/i);
  });

  it('shows loading state while saving', async () => {
    const user = userEvent.setup();
    updateMe.mockImplementation(() => new Promise(() => {}));

    renderForm();
    await user.click(screen.getByRole('button', { name: /save changes/i }));

    expect(await screen.findByText(/saving/i)).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('displays user email as read-only', () => {
    renderForm();
    expect(screen.getByText('jane@example.com')).toBeInTheDocument();
  });
});
