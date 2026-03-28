import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

jest.mock('../services/api', () => ({
  getFabrics: jest.fn(),
  getFabricFilters: jest.fn(),
}));

import { getFabrics, getFabricFilters } from '../services/api';
import FabricCatalogPage from './FabricCatalogPage';

const MOCK_FABRICS = [
  { _id: 'f1', name: 'Italian Merino Wool', material: 'wool', color: 'navy', pattern: 'solid', price: 320, origin: 'Italy', thumbnailUrl: null },
  { _id: 'f2', name: 'Cotton Oxford', material: 'cotton', color: 'white', pattern: 'solid', price: 120, origin: 'Egypt', thumbnailUrl: null },
];

const MOCK_RESULT = { fabrics: MOCK_FABRICS, total: 2, page: 1, pages: 1, limit: 24 };
const MOCK_FILTERS = { materials: ['wool', 'cotton'], colors: ['navy', 'white'], patterns: ['solid'] };

beforeEach(() => {
  jest.clearAllMocks();
  getFabricFilters.mockResolvedValue(MOCK_FILTERS);
  getFabrics.mockResolvedValue(MOCK_RESULT);
});

function renderPage(initialEntries = ['/fabrics']) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <Routes>
        <Route path="/fabrics" element={<FabricCatalogPage />} />
        <Route path="/fabrics/:id" element={<div>Fabric Detail</div>} />
        <Route path="/dashboard" element={<div>Dashboard</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('FabricCatalogPage', () => {
  it('renders page heading', () => {
    renderPage();
    expect(screen.getByText('Fabric Catalog')).toBeInTheDocument();
  });

  it('shows skeleton cards while loading', () => {
    getFabrics.mockImplementation(() => new Promise(() => {}));
    renderPage();
    // Skeleton cards are divs with animate-pulse class
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('shows fabric cards after loading', async () => {
    renderPage();
    expect(await screen.findByText('Italian Merino Wool')).toBeInTheDocument();
    expect(screen.getByText('Cotton Oxford')).toBeInTheDocument();
  });

  it('shows fabric count', async () => {
    renderPage();
    expect(await screen.findByText(/2 fabrics found/i)).toBeInTheDocument();
  });

  it('renders search input', () => {
    renderPage();
    expect(screen.getByRole('searchbox', { name: /search fabrics/i })).toBeInTheDocument();
  });

  it('renders sort dropdown', () => {
    renderPage();
    expect(screen.getByRole('combobox', { name: /sort fabrics/i })).toBeInTheDocument();
  });

  it('shows error banner when API fails', async () => {
    getFabrics.mockRejectedValue(new Error('Network error'));
    renderPage();
    expect(await screen.findByRole('alert')).toHaveTextContent(/failed to load/i);
  });

  it('shows empty state when no fabrics returned', async () => {
    getFabrics.mockResolvedValue({ fabrics: [], total: 0, page: 1, pages: 0, limit: 24 });
    renderPage();
    expect(await screen.findByText(/no fabrics match/i)).toBeInTheDocument();
  });

  it('shows pagination when pages > 1', async () => {
    getFabrics.mockResolvedValue({ fabrics: MOCK_FABRICS, total: 50, page: 1, pages: 3, limit: 24 });
    renderPage();
    expect(await screen.findByRole('button', { name: /next/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /previous/i })).toBeDisabled();
  });

  it('does not show pagination when only 1 page', async () => {
    renderPage();
    await screen.findByText('Italian Merino Wool');
    expect(screen.queryByRole('button', { name: /next/i })).not.toBeInTheDocument();
  });

  it('changes sort and refetches', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('Italian Merino Wool');

    await user.selectOptions(screen.getByRole('combobox', { name: /sort/i }), 'price_asc');

    await waitFor(() => {
      expect(getFabrics).toHaveBeenCalledWith(expect.objectContaining({ sort: 'price_asc' }));
    });
  });

  it('shows 1 fabric singular text', async () => {
    getFabrics.mockResolvedValue({ fabrics: [MOCK_FABRICS[0]], total: 1, page: 1, pages: 1, limit: 24 });
    renderPage();
    expect(await screen.findByText(/1 fabric found/i)).toBeInTheDocument();
  });
});
