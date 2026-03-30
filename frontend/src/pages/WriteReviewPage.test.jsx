import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

jest.mock('../services/api', () => ({
  getOrderDetail: jest.fn(),
  createReview: jest.fn(),
}));

import { getOrderDetail, createReview } from '../services/api';
import WriteReviewPage from './WriteReviewPage';

const MOCK_DELIVERED_ORDER = {
  _id: 'order-1',
  orderNumber: 'IT-202601-AB12CD',
  status: 'delivered',
  items: [{ fabricId: 'fabric-1', fabricName: 'Italian Merino Wool', unitPrice: 320, quantity: 1 }],
};

function renderPage(orderId = 'order-1') {
  return render(
    <MemoryRouter initialEntries={[`/account/orders/${orderId}/review`]}>
      <Routes>
        <Route path="/account/orders/:orderId/review" element={<WriteReviewPage />} />
        <Route path="/account/orders" element={<div>Orders list</div>} />
      </Routes>
    </MemoryRouter>
  );
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('WriteReviewPage', () => {
  it('shows a loading spinner while fetching the order', () => {
    getOrderDetail.mockReturnValue(new Promise(() => {})); // never resolves
    renderPage();
    expect(screen.getByLabelText('Loading')).toBeInTheDocument();
  });

  it('shows an error when the order cannot be loaded', async () => {
    getOrderDetail.mockRejectedValue(new Error('Order not found'));
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/order not found/i)).toBeInTheDocument();
    });
  });

  it('shows a "not yet delivered" message for non-delivered orders', async () => {
    getOrderDetail.mockResolvedValue({ data: { order: { ...MOCK_DELIVERED_ORDER, status: 'confirmed' } } });
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/reviews are available after delivery/i)).toBeInTheDocument();
    });
  });

  it('renders the review form for a delivered order', async () => {
    getOrderDetail.mockResolvedValue({ data: { order: MOCK_DELIVERED_ORDER } });
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Italian Merino Wool')).toBeInTheDocument();
      // Order number appears in breadcrumb and in the form context area
      const orderRefs = screen.getAllByText(/IT-202601-AB12CD/);
      expect(orderRefs.length).toBeGreaterThanOrEqual(1);
      expect(screen.getByRole('button', { name: /submit review/i })).toBeInTheDocument();
    });
  });

  it('shows success state after successful review submission', async () => {
    getOrderDetail.mockResolvedValue({ data: { order: MOCK_DELIVERED_ORDER } });
    createReview.mockResolvedValue({ status: 'success', data: { review: { _id: 'r1' } } });

    renderPage();

    await waitFor(() => {
      expect(screen.getByTestId('star-quality-5')).toBeInTheDocument();
    });

    // Select 5 stars
    fireEvent.click(screen.getByTestId('star-quality-5'));
    // Enter body
    fireEvent.change(screen.getByLabelText(/Review \(optional/i), {
      target: { value: 'This is an excellent fabric, highly recommend it.' },
    });
    // Submit
    fireEvent.click(screen.getByRole('button', { name: /submit review/i }));

    await waitFor(() => {
      expect(screen.getByText(/thank you for your review/i)).toBeInTheDocument();
    });
  });

  it('shows a submit error when createReview fails with duplicate message', async () => {
    getOrderDetail.mockResolvedValue({ data: { order: MOCK_DELIVERED_ORDER } });
    createReview.mockRejectedValue(new Error('You have already reviewed this item. You can edit your existing review.'));

    renderPage();

    await waitFor(() => {
      expect(screen.getByTestId('star-quality-3')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('star-quality-3'));
    fireEvent.change(screen.getByLabelText(/Review \(optional/i), {
      target: { value: 'Decent quality but nothing spectacular honestly.' },
    });
    fireEvent.click(screen.getByRole('button', { name: /submit review/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/already reviewed/i);
    });
  });
});
