import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

jest.mock('../../services/api', () => ({
  getFabrics: jest.fn(),
}));

import { getFabrics } from '../../services/api';
import FeaturedFabrics from './FeaturedFabrics';

const MOCK_FABRICS = [
  { _id: 'f1', name: 'Italian Merino Wool', material: 'wool', color: 'navy', pattern: 'solid', price: 320, thumbnailUrl: null, origin: 'Italy' },
  { _id: 'f2', name: 'Cotton Oxford', material: 'cotton', color: 'white', pattern: 'solid', price: 120, thumbnailUrl: null, origin: null },
  { _id: 'f3', name: 'Silk Charmeuse', material: 'silk', color: 'ivory', pattern: 'plain', price: 480, thumbnailUrl: null, origin: 'France' },
];

function renderSection() {
  return render(
    <MemoryRouter>
      <FeaturedFabrics />
    </MemoryRouter>
  );
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('FeaturedFabrics', () => {
  it('renders section heading', async () => {
    getFabrics.mockResolvedValue({ fabrics: MOCK_FABRICS });
    renderSection();
    expect(await screen.findByRole('heading', { name: /featured fabrics/i })).toBeInTheDocument();
  });

  it('shows skeleton cards while loading', () => {
    getFabrics.mockImplementation(() => new Promise(() => {}));
    renderSection();
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBe(6);
  });

  it('renders fabric names after loading', async () => {
    getFabrics.mockResolvedValue({ fabrics: MOCK_FABRICS });
    renderSection();
    expect(await screen.findByText('Italian Merino Wool')).toBeInTheDocument();
    expect(screen.getByText('Cotton Oxford')).toBeInTheDocument();
    expect(screen.getByText('Silk Charmeuse')).toBeInTheDocument();
  });

  it('shows empty state when no fabrics returned', async () => {
    getFabrics.mockResolvedValue({ fabrics: [] });
    renderSection();
    expect(await screen.findByText(/no fabrics available yet/i)).toBeInTheDocument();
  });

  it('shows error alert when API fails', async () => {
    getFabrics.mockRejectedValue(new Error('Network error'));
    renderSection();
    expect(await screen.findByRole('alert')).toHaveTextContent(/network error/i);
  });

  it('renders "View all fabrics" link to /fabrics', async () => {
    getFabrics.mockResolvedValue({ fabrics: MOCK_FABRICS });
    renderSection();
    await screen.findByText('Italian Merino Wool');
    const link = screen.getByRole('link', { name: /view all fabrics/i });
    expect(link).toHaveAttribute('href', '/fabrics');
  });

  it('calls getFabrics with limit 6 and sort newest', async () => {
    getFabrics.mockResolvedValue({ fabrics: [] });
    renderSection();
    await waitFor(() => expect(getFabrics).toHaveBeenCalledWith({ limit: 6, sort: 'newest' }));
  });

  it('each fabric card links to its detail page', async () => {
    getFabrics.mockResolvedValue({ fabrics: MOCK_FABRICS });
    renderSection();
    await screen.findByText('Italian Merino Wool');
    const link = screen.getByRole('link', { name: /italian merino wool/i });
    expect(link).toHaveAttribute('href', '/fabrics/f1');
  });
});
