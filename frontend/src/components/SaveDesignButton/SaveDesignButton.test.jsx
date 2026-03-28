import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import SaveDesignButton from './SaveDesignButton';

jest.mock('../../store/suitStore', () => ({ __esModule: true, default: jest.fn() }));
jest.mock('../../store/authStore', () => ({ __esModule: true, default: jest.fn() }));
jest.mock('../../services/design.service', () => ({
  saveDesign: jest.fn(),
}));

import useSuitStore from '../../store/suitStore';
import useAuthStore from '../../store/authStore';
import { saveDesign } from '../../services/design.service';

beforeEach(() => {
  jest.clearAllMocks();
  useSuitStore.mockReturnValue({ config: { style: { id: 'single-2' } } });
});

function renderBtn(isAuthenticated = true) {
  useAuthStore.mockReturnValue({ accessToken: isAuthenticated ? 'tok_abc' : null });
  return render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <SaveDesignButton />
    </MemoryRouter>
  );
}

describe('SaveDesignButton', () => {
  it('renders Save Design button', () => {
    renderBtn();
    expect(screen.getByText('Save Design')).toBeInTheDocument();
  });

  it('shows sign in message when not authenticated', async () => {
    renderBtn(false);
    fireEvent.click(screen.getByText('Save Design'));
    await waitFor(() => expect(screen.getByText('Sign in to save')).toBeInTheDocument());
  });

  it('calls saveDesign when authenticated', async () => {
    saveDesign.mockResolvedValueOnce({ data: { status: 'success' } });
    renderBtn(true);
    fireEvent.click(screen.getByText('Save Design'));
    await waitFor(() => expect(saveDesign).toHaveBeenCalled());
  });

  it('shows saved confirmation after success', async () => {
    saveDesign.mockResolvedValueOnce({ data: { status: 'success' } });
    renderBtn(true);
    fireEvent.click(screen.getByText('Save Design'));
    await waitFor(() => expect(screen.getByText(/Design Saved/i)).toBeInTheDocument());
  });

  it('shows error on save failure', async () => {
    saveDesign.mockRejectedValueOnce(new Error('Network error'));
    renderBtn(true);
    fireEvent.click(screen.getByText('Save Design'));
    await waitFor(() => expect(screen.getByText('Save failed')).toBeInTheDocument());
  });
});
