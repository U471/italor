import { render, screen } from '@testing-library/react';
import StarRating from './StarRating';

describe('StarRating', () => {
  it('renders with accessible label', () => {
    render(<StarRating rating={4} />);
    expect(screen.getByRole('img', { name: /4 out of 5 stars/i })).toBeInTheDocument();
  });

  it('renders 5 star characters', () => {
    render(<StarRating rating={5} />);
    const container = screen.getByRole('img');
    expect(container.textContent).toContain('★');
  });

  it('renders empty stars for 0 rating', () => {
    render(<StarRating rating={0} />);
    const container = screen.getByRole('img');
    expect(container.textContent).not.toContain('★');
    expect(container.textContent).toContain('☆');
  });

  it('renders mixed filled/empty stars for partial rating', () => {
    render(<StarRating rating={3} />);
    const container = screen.getByRole('img');
    expect(container.textContent).toContain('★');
    expect(container.textContent).toContain('☆');
  });

  it('renders with xs size class', () => {
    const { container } = render(<StarRating rating={4} size="xs" />);
    expect(container.firstChild).toHaveClass('text-xs');
  });

  it('renders with md size class', () => {
    const { container } = render(<StarRating rating={4} size="md" />);
    expect(container.firstChild).toHaveClass('text-base');
  });
});
