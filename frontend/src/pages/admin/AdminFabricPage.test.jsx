import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

jest.mock('../../services/api', () => ({
  adminGetFabrics: jest.fn(),
  adminCreateFabric: jest.fn(),
  adminUpdateFabric: jest.fn(),
  adminDeleteFabric: jest.fn(),
  adminUploadFabricImage: jest.fn(),
  adminRemoveFabricImage: jest.fn(),
}));

import {
  adminGetFabrics,
  adminCreateFabric,
  adminUpdateFabric,
  adminDeleteFabric,
} from '../../services/api';
import AdminFabricPage from './AdminFabricPage';

const MOCK_FABRICS = [
  { _id: 'f1', name: 'Italian Merino Wool', material: 'wool', color: 'navy', pattern: 'solid', price: 320, stock: 50, isActive: true, thumbnailUrl: null, images: [] },
  { _id: 'f2', name: 'Cotton Oxford', material: 'cotton', color: 'white', pattern: 'solid', price: 120, stock: 30, isActive: false, thumbnailUrl: null, images: [] },
];

const MOCK_RESULT = { fabrics: MOCK_FABRICS, total: 2, page: 1, pages: 1 };

beforeEach(() => {
  jest.clearAllMocks();
  adminGetFabrics.mockResolvedValue(MOCK_RESULT);
  // suppress window.confirm
  window.confirm = jest.fn(() => true);
});

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/admin/fabrics']}>
      <Routes>
        <Route path="/admin/fabrics" element={<AdminFabricPage />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('AdminFabricPage', () => {
  it('renders page heading', async () => {
    renderPage();
    expect(await screen.findByText(/fabric management/i)).toBeInTheDocument();
  });

  it('shows total fabric count', async () => {
    renderPage();
    expect(await screen.findByText(/2 total/i)).toBeInTheDocument();
  });

  it('renders fabric names in table', async () => {
    renderPage();
    expect(await screen.findByText('Italian Merino Wool')).toBeInTheDocument();
    expect(screen.getByText('Cotton Oxford')).toBeInTheDocument();
  });

  it('shows Active badge for active fabric', async () => {
    renderPage();
    await screen.findByText('Italian Merino Wool');
    expect(screen.getAllByText('Active')[0]).toBeInTheDocument();
  });

  it('shows Inactive badge for inactive fabric', async () => {
    renderPage();
    await screen.findByText('Cotton Oxford');
    expect(screen.getByText('Inactive')).toBeInTheDocument();
  });

  it('shows skeleton rows while loading', () => {
    adminGetFabrics.mockImplementation(() => new Promise(() => {}));
    renderPage();
    const pulseRows = document.querySelectorAll('.animate-pulse');
    expect(pulseRows.length).toBeGreaterThan(0);
  });

  it('shows error when API fails', async () => {
    adminGetFabrics.mockRejectedValue(new Error('Network error'));
    renderPage();
    expect(await screen.findByRole('alert')).toHaveTextContent(/failed to load/i);
  });

  it('shows empty state when no fabrics', async () => {
    adminGetFabrics.mockResolvedValue({ fabrics: [], total: 0, page: 1, pages: 1 });
    renderPage();
    expect(await screen.findByText(/no fabrics found/i)).toBeInTheDocument();
  });

  it('opens create modal when New Fabric button clicked', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('Italian Merino Wool');

    await user.click(screen.getByRole('button', { name: /new fabric/i }));

    expect(screen.getByRole('dialog', { name: /new fabric/i })).toBeInTheDocument();
  });

  it('opens edit modal when Edit button clicked', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('Italian Merino Wool');

    await user.click(screen.getByRole('button', { name: /edit italian merino wool/i }));

    expect(screen.getByRole('dialog', { name: /edit/i })).toBeInTheDocument();
    expect(screen.getByDisplayValue('Italian Merino Wool')).toBeInTheDocument();
  });

  it('closes modal when Cancel clicked', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('Italian Merino Wool');

    await user.click(screen.getByRole('button', { name: /new fabric/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /cancel/i }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('calls adminCreateFabric and reloads on create submit', async () => {
    const user = userEvent.setup();
    adminCreateFabric.mockResolvedValue({ fabric: MOCK_FABRICS[0] });
    renderPage();
    await screen.findByText('Italian Merino Wool');

    await user.click(screen.getByRole('button', { name: /new fabric/i }));
    await user.type(screen.getByLabelText(/^name/i), 'Test Fabric');
    await user.type(screen.getByLabelText(/^color/i), 'red');
    await user.type(screen.getByLabelText(/price/i), '150');
    await user.click(screen.getByRole('button', { name: /create fabric/i }));

    await waitFor(() => expect(adminCreateFabric).toHaveBeenCalled());
    await waitFor(() => expect(adminGetFabrics).toHaveBeenCalledTimes(2));
  });

  it('calls adminUpdateFabric on edit submit', async () => {
    const user = userEvent.setup();
    adminUpdateFabric.mockResolvedValue({ fabric: MOCK_FABRICS[0] });
    renderPage();
    await screen.findByText('Italian Merino Wool');

    await user.click(screen.getByRole('button', { name: /edit italian merino wool/i }));
    const nameInput = screen.getByDisplayValue('Italian Merino Wool');
    await user.clear(nameInput);
    await user.type(nameInput, 'Updated Fabric');
    await user.click(screen.getByRole('button', { name: /update fabric/i }));

    await waitFor(() => expect(adminUpdateFabric).toHaveBeenCalledWith('f1', expect.objectContaining({ name: 'Updated Fabric' })));
  });

  it('calls adminDeleteFabric when Deactivate clicked and confirmed', async () => {
    const user = userEvent.setup();
    adminDeleteFabric.mockResolvedValue({ message: 'deactivated' });
    renderPage();
    await screen.findByText('Italian Merino Wool');

    await user.click(screen.getByRole('button', { name: /deactivate italian merino wool/i }));

    await waitFor(() => expect(adminDeleteFabric).toHaveBeenCalledWith('f1'));
  });

  it('does not call adminDeleteFabric when confirm cancelled', async () => {
    window.confirm = jest.fn(() => false);
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('Italian Merino Wool');

    await user.click(screen.getByRole('button', { name: /deactivate italian merino wool/i }));

    expect(adminDeleteFabric).not.toHaveBeenCalled();
  });

  it('does not show Deactivate button for inactive fabric', async () => {
    renderPage();
    await screen.findByText('Cotton Oxford');
    expect(screen.queryByRole('button', { name: /deactivate cotton oxford/i })).not.toBeInTheDocument();
  });

  it('shows pagination when pages > 1', async () => {
    adminGetFabrics.mockResolvedValue({ ...MOCK_RESULT, pages: 3 });
    renderPage();
    expect(await screen.findByRole('button', { name: /next/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /previous/i })).toBeDisabled();
  });

  it('renders New Fabric button', async () => {
    renderPage();
    await screen.findByText('Italian Merino Wool');
    expect(screen.getByRole('button', { name: /new fabric/i })).toBeInTheDocument();
  });
});
