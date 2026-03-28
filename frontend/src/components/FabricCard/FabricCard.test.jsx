import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import FabricCard from './FabricCard';

const MOCK_FABRIC = {
  _id: 'f1',
  name: 'Italian Merino Wool',
  material: 'wool',
  color: 'navy',
  pattern: 'solid',
  price: 320,
  origin: 'Italy',
  thumbnailUrl: null,
};

function renderCard(fabric = MOCK_FABRIC) {
  return render(
    <MemoryRouter>
      <FabricCard fabric={fabric} />
    </MemoryRouter>
  );
}

describe('FabricCard', () => {
  it('renders fabric name', () => {
    renderCard();
    expect(screen.getByText('Italian Merino Wool')).toBeInTheDocument();
  });

  it('renders price correctly', () => {
    renderCard();
    expect(screen.getByText('£320')).toBeInTheDocument();
  });

  it('renders material badge', () => {
    renderCard();
    expect(screen.getByText('wool')).toBeInTheDocument();
  });

  it('renders pattern badge', () => {
    renderCard();
    expect(screen.getByText('solid')).toBeInTheDocument();
  });

  it('renders origin', () => {
    renderCard();
    expect(screen.getByText('Italy')).toBeInTheDocument();
  });

  it('links to fabric detail page', () => {
    renderCard();
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/fabrics/f1');
  });

  it('shows emoji placeholder when no thumbnailUrl', () => {
    renderCard();
    expect(screen.getByText('🧵')).toBeInTheDocument();
  });

  it('renders img when thumbnailUrl is provided', () => {
    renderCard({ ...MOCK_FABRIC, thumbnailUrl: 'https://example.com/img.jpg' });
    expect(screen.getByRole('img')).toHaveAttribute('src', 'https://example.com/img.jpg');
  });
});
