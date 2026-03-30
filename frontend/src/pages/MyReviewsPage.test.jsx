import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

jest.mock('../services/api', () => ({
  getMyReviews: jest.fn(),
  markReviewHelpful: jest.fn(),
  deleteReview: jest.fn(),
}));

import { getMyReviews, markReviewHelpful, deleteReview } from '../services/api';
import MyReviewsPage from './MyReviewsPage';

const MOCK_REVIEW = {
  _id: 'r1',
  displayName: 'James T.',
  rating: 5,
  fitRating: null,
  title: 'Outstanding',
  body: 'Wonderful fabric.',
  isVerifiedPurchase: true,
  helpfulVotes: 2,
  createdAt: '2024-01-15T10:00:00.000Z',
  fabric: { _id: 'f1', name: 'Italian Merino Wool', thumbnailUrl: null },
};

function renderPage() {
  return render(
    <MemoryRouter>
      <MyReviewsPage />
    </MemoryRouter>
  );
}

beforeEach(() => jest.clearAllMocks());

describe('MyReviewsPage', () => {
  it('shows a loading spinner while fetching', () => {
    getMyReviews.mockReturnValue(new Promise(() => {}));
    renderPage();
    expect(screen.getByLabelText('Loading reviews')).toBeInTheDocument();
  });

  it('shows an error message when fetch fails', async () => {
    getMyReviews.mockRejectedValue(new Error('Network error'));
    renderPage();
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Network error');
    });
  });

  it('shows empty state when user has no reviews', async () => {
    getMyReviews.mockResolvedValue({ data: { reviews: [], total: 0, page: 1, pages: 1 } });
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/haven't written any reviews/i)).toBeInTheDocument();
    });
  });

  it('renders a list of reviews', async () => {
    getMyReviews.mockResolvedValue({ data: { reviews: [MOCK_REVIEW], total: 1, page: 1, pages: 1 } });
    renderPage();
    await waitFor(() => {
      expect(screen.getByTestId('review-card')).toBeInTheDocument();
      expect(screen.getByText('Outstanding')).toBeInTheDocument();
    });
  });

  it('shows total review count in header', async () => {
    getMyReviews.mockResolvedValue({ data: { reviews: [MOCK_REVIEW], total: 1, page: 1, pages: 1 } });
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('1 review')).toBeInTheDocument();
    });
  });

  it('optimistically updates helpful vote count on Helpful click', async () => {
    getMyReviews.mockResolvedValue({ data: { reviews: [MOCK_REVIEW], total: 1, page: 1, pages: 1 } });
    markReviewHelpful.mockResolvedValue({ data: { helpfulVotes: 3 } });
    renderPage();

    await waitFor(() => {
      expect(screen.getByText(/2 people found this helpful/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /mark review as helpful/i }));

    await waitFor(() => {
      expect(screen.getByText(/3 people found this helpful/i)).toBeInTheDocument();
    });
  });

  it('removes the review from the list after successful deletion', async () => {
    getMyReviews.mockResolvedValue({ data: { reviews: [MOCK_REVIEW], total: 1, page: 1, pages: 1 } });
    deleteReview.mockResolvedValue({ status: 'success' });
    window.confirm = jest.fn(() => true);

    renderPage();

    await waitFor(() => {
      expect(screen.getByTestId('review-card')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /delete review/i }));

    await waitFor(() => {
      expect(screen.queryByTestId('review-card')).not.toBeInTheDocument();
    });
  });

  it('does not delete when user cancels the confirm dialog', async () => {
    getMyReviews.mockResolvedValue({ data: { reviews: [MOCK_REVIEW], total: 1, page: 1, pages: 1 } });
    window.confirm = jest.fn(() => false);

    renderPage();

    await waitFor(() => {
      expect(screen.getByTestId('review-card')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /delete review/i }));

    expect(deleteReview).not.toHaveBeenCalled();
    expect(screen.getByTestId('review-card')).toBeInTheDocument();
  });
});
