import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// ── Mock api ─────────────────────────────────────────────────────────────────
jest.mock('../../services/api', () => ({
  updateAvatar: jest.fn(),
}));

// ── Mock Zustand authStore ────────────────────────────────────────────────────
const mockSetAuth = jest.fn();
jest.mock('../../store/authStore', () => ({
  __esModule: true,
  default: jest.fn((selector) =>
    selector({
      user: { firstName: 'Jane', lastName: 'Doe', avatarUrl: null },
      accessToken: 'test-token',
      setAuth: mockSetAuth,
    })
  ),
}));

// ── Mock URL.createObjectURL ──────────────────────────────────────────────────
globalThis.URL.createObjectURL = jest.fn(() => 'blob:mock-url');

import { updateAvatar } from '../../services/api';
import AvatarUpload from './AvatarUpload';

beforeEach(() => {
  jest.clearAllMocks();
});

function renderComponent() {
  return render(<AvatarUpload />);
}

describe('AvatarUpload', () => {
  it('renders without crashing', () => {
    renderComponent();
    expect(screen.getByRole('button', { name: /upload avatar/i })).toBeInTheDocument();
  });

  it('shows initials when no avatar is set', () => {
    renderComponent();
    expect(screen.getByText('JD')).toBeInTheDocument();
  });

  it('shows error for oversized file', async () => {
    const user = userEvent.setup();
    renderComponent();

    const bigFile = new File(['x'.repeat(3 * 1024 * 1024)], 'big.jpg', { type: 'image/jpeg' });
    const input = screen.getByTestId('avatar-file-input');
    await user.upload(input, bigFile);

    expect(await screen.findByRole('alert')).toHaveTextContent(/2 MB/i);
    expect(updateAvatar).not.toHaveBeenCalled();
  });

  it('shows error for unsupported file type', async () => {
    renderComponent();

    const gifFile = new File(['gif-data'], 'anim.gif', { type: 'image/gif' });
    const input = screen.getByTestId('avatar-file-input');

    // userEvent v14 respects the accept attribute and silently drops non-matching files.
    // Use fireEvent.change directly to bypass that filter.
    Object.defineProperty(input, 'files', { value: [gifFile], configurable: true });
    fireEvent.change(input);

    expect(await screen.findByRole('alert')).toHaveTextContent(/JPG, PNG/i);
    expect(updateAvatar).not.toHaveBeenCalled();
  });

  it('calls updateAvatar and shows success on valid upload', async () => {
    const user = userEvent.setup();
    updateAvatar.mockResolvedValue({ avatarUrl: 'https://cdn.example.com/avatar.jpg' });
    renderComponent();

    const file = new File(['img'], 'photo.jpg', { type: 'image/jpeg' });
    const input = screen.getByTestId('avatar-file-input');
    await user.upload(input, file);

    expect(await screen.findByRole('status')).toHaveTextContent(/avatar updated/i);
    expect(updateAvatar).toHaveBeenCalled();
    expect(mockSetAuth).toHaveBeenCalled();
  });

  it('shows error when upload fails', async () => {
    const user = userEvent.setup();
    updateAvatar.mockRejectedValue(new Error('Upload failed'));
    renderComponent();

    const file = new File(['img'], 'photo.png', { type: 'image/png' });
    const input = screen.getByTestId('avatar-file-input');
    await user.upload(input, file);

    expect(await screen.findByRole('alert')).toHaveTextContent(/upload failed/i);
  });
});
