import { render, screen, fireEvent } from '@testing-library/react';
import ReviewCard from './ReviewCard';

const MOCK_REVIEW = {
  _id: 'r1',
  displayName: 'James T.',
  rating: 5,
  fitRating: 4,
  title: 'Outstanding quality',
  body: 'Absolutely love this fabric. Well worth the price.',
  isVerifiedPurchase: true,
  helpfulVotes: 3,
  createdAt: '2024-01-15T10:00:00.000Z',
};

describe('ReviewCard', () => {
  it('renders reviewer name and date', () => {
    render(<ReviewCard review={MOCK_REVIEW} />);
    expect(screen.getByText('James T.')).toBeInTheDocument();
    expect(screen.getByText(/Jan 2024|15 Jan/i)).toBeInTheDocument();
  });

  it('renders the Verified Purchase badge when isVerifiedPurchase is true', () => {
    render(<ReviewCard review={MOCK_REVIEW} />);
    expect(screen.getByText('Verified Purchase')).toBeInTheDocument();
  });

  it('does not render Verified Purchase badge when isVerifiedPurchase is false', () => {
    render(<ReviewCard review={{ ...MOCK_REVIEW, isVerifiedPurchase: false }} />);
    expect(screen.queryByText('Verified Purchase')).not.toBeInTheDocument();
  });

  it('renders review title and body', () => {
    render(<ReviewCard review={MOCK_REVIEW} />);
    expect(screen.getByText('Outstanding quality')).toBeInTheDocument();
    expect(screen.getByText(/Absolutely love this fabric/)).toBeInTheDocument();
  });

  it('renders fit rating section when fitRating is provided', () => {
    render(<ReviewCard review={MOCK_REVIEW} />);
    expect(screen.getByText('Fit')).toBeInTheDocument();
  });

  it('does not render fit rating section when fitRating is null', () => {
    render(<ReviewCard review={{ ...MOCK_REVIEW, fitRating: null }} />);
    expect(screen.queryByText('Fit')).not.toBeInTheDocument();
  });

  it('renders helpful count and button when onHelpful callback is provided', () => {
    const onHelpful = jest.fn();
    render(<ReviewCard review={MOCK_REVIEW} onHelpful={onHelpful} />);
    expect(screen.getByText(/3 people found this helpful/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /helpful/i })).toBeInTheDocument();
  });

  it('calls onHelpful with the review id when Helpful button is clicked', () => {
    const onHelpful = jest.fn();
    render(<ReviewCard review={MOCK_REVIEW} onHelpful={onHelpful} />);
    fireEvent.click(screen.getByRole('button', { name: /helpful/i }));
    expect(onHelpful).toHaveBeenCalledWith('r1');
  });

  it('does not render helpful section when onHelpful is not provided', () => {
    render(<ReviewCard review={MOCK_REVIEW} />);
    expect(screen.queryByRole('button', { name: /helpful/i })).not.toBeInTheDocument();
  });

  it('renders "1 person found this helpful" for a single vote', () => {
    const onHelpful = jest.fn();
    render(<ReviewCard review={{ ...MOCK_REVIEW, helpfulVotes: 1 }} onHelpful={onHelpful} />);
    expect(screen.getByText(/1 person found this helpful/i)).toBeInTheDocument();
  });
});
