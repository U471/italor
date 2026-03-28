import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

jest.mock('../services/api', () => ({
  getFabricById: jest.fn(),
  getFabricReviews: jest.fn(),
}));

import { getFabricById, getFabricReviews } from '../services/api';
import FabricDetailPage from './FabricDetailPage';

const MOCK_FABRIC = {
  _id: 'f1',
  name: 'Italian Merino Wool',
  material: 'wool',
  color: 'navy',
  pattern: 'solid',
  price: 320,
  origin: 'Italy',
  weight: 280,
  season: 'all-year',
  careInstructions: 'Dry clean only.',
  patternDescription: 'Clean solid navy.',
  images: ['https://example.com/img.jpg'], // provide image so gallery doesn't show name placeholder
  thumbnailUrl: null,
  stock: 50,
  averageRating: 4.5,
  reviewCount: 12,
};

const MOCK_RELATED = [
  { _id: 'f2', name: 'Navy Chalk Stripe', material: 'wool', color: 'navy', pattern: 'striped', price: 290, thumbnailUrl: null },
];

const MOCK_REVIEWS = {
  reviews: [
    {
      _id: 'r1',
      displayName: 'James T.',
      rating: 5,
      fitRating: 4,
      title: 'Outstanding quality',
      body: 'Absolutely love this fabric.',
      isVerifiedPurchase: true,
      createdAt: '2024-01-15T10:00:00.000Z',
    },
  ],
  total: 1,
  page: 1,
  pages: 1,
};

beforeEach(() => {
  jest.clearAllMocks();
  getFabricById.mockResolvedValue({ fabric: MOCK_FABRIC, related: MOCK_RELATED });
  getFabricReviews.mockResolvedValue(MOCK_REVIEWS);
});

function renderPage(id = 'f1') {
  return render(
    <MemoryRouter initialEntries={[`/fabrics/${id}`]}>
      <Routes>
        <Route path="/fabrics/:id" element={<FabricDetailPage />} />
        <Route path="/fabrics" element={<div>Catalog</div>} />
        <Route path="/builder" element={<div>Builder</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('FabricDetailPage', () => {
  it('renders fabric name in heading after loading', async () => {
    renderPage();
    expect(await screen.findByRole('heading', { level: 1, name: 'Italian Merino Wool' })).toBeInTheDocument();
  });

  it('renders fabric price', async () => {
    renderPage();
    await screen.findByRole('heading', { level: 1 });
    expect(screen.getByText(/£320/)).toBeInTheDocument();
  });

  it('renders breadcrumb with fabric name', async () => {
    renderPage();
    await screen.findByRole('heading', { level: 1 });
    const nav = screen.getByRole('navigation', { name: /breadcrumb/i });
    expect(nav).toHaveTextContent('Italian Merino Wool');
    expect(nav).toHaveTextContent('Fabrics');
    expect(nav).toHaveTextContent('Home');
  });

  it('renders spec table with origin and weight', async () => {
    renderPage();
    await screen.findByRole('heading', { level: 1 });
    expect(screen.getByText('Italy')).toBeInTheDocument();
    expect(screen.getByText('280 GSM')).toBeInTheDocument();
  });

  it('renders care instructions', async () => {
    renderPage();
    await screen.findByRole('heading', { level: 1 });
    expect(screen.getByText('Dry clean only.')).toBeInTheDocument();
  });

  it('renders pattern description', async () => {
    renderPage();
    await screen.findByText('Clean solid navy.');
  });

  it('renders average rating', async () => {
    renderPage();
    await screen.findByRole('heading', { level: 1 });
    expect(screen.getByText(/4\.5/)).toBeInTheDocument();
    expect(screen.getByText(/12 reviews/i)).toBeInTheDocument();
  });

  it('renders Start Designing button linking to /builder', async () => {
    renderPage();
    await screen.findByRole('heading', { level: 1 });
    const link = screen.getByRole('link', { name: /start designing/i });
    expect(link).toHaveAttribute('href', '/builder?fabric=f1');
  });

  it('renders related fabrics section', async () => {
    renderPage();
    await screen.findByRole('heading', { level: 1 });
    expect(screen.getByRole('region', { name: /related fabrics/i })).toBeInTheDocument();
    expect(screen.getByText('Navy Chalk Stripe')).toBeInTheDocument();
  });

  it('renders reviews after loading', async () => {
    renderPage();
    expect(await screen.findByText('Outstanding quality')).toBeInTheDocument();
    expect(screen.getByText('James T.')).toBeInTheDocument();
    expect(screen.getByText('Absolutely love this fabric.')).toBeInTheDocument();
  });

  it('shows Verified Purchase badge', async () => {
    renderPage();
    expect(await screen.findByText('Verified Purchase')).toBeInTheDocument();
  });

  it('shows skeleton while loading', () => {
    getFabricById.mockImplementation(() => new Promise(() => {}));
    renderPage();
    const pulseElements = document.querySelectorAll('.animate-pulse');
    expect(pulseElements.length).toBeGreaterThan(0);
  });

  it('shows error state when API fails', async () => {
    getFabricById.mockRejectedValue(new Error('Network error'));
    renderPage();
    expect(await screen.findByText(/failed to load fabric/i)).toBeInTheDocument();
  });

  it('shows empty reviews message when no reviews', async () => {
    getFabricReviews.mockResolvedValue({ reviews: [], total: 0, page: 1, pages: 0 });
    renderPage();
    await screen.findByRole('heading', { level: 1 });
    await waitFor(() => {
      expect(screen.getByText(/no reviews yet\. be the first/i)).toBeInTheDocument();
    });
  });

  it('shows no reviews text in rating area when averageRating is null', async () => {
    getFabricById.mockResolvedValue({
      fabric: { ...MOCK_FABRIC, averageRating: null, reviewCount: 0 },
      related: [],
    });
    renderPage();
    await screen.findByRole('heading', { level: 1 });
    // rating area shows "No reviews yet"
    expect(screen.getByText('No reviews yet')).toBeInTheDocument();
  });

  it('shows review pagination when pages > 1', async () => {
    getFabricReviews.mockResolvedValue({
      reviews: MOCK_REVIEWS.reviews,
      total: 10,
      page: 1,
      pages: 2,
    });
    renderPage();
    await screen.findByText('Outstanding quality');
    expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();
  });

  it('renders stock availability', async () => {
    renderPage();
    await screen.findByRole('heading', { level: 1 });
    expect(screen.getByText(/in stock/i)).toBeInTheDocument();
  });
});
