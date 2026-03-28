import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ImageGallery from './ImageGallery';

describe('ImageGallery', () => {
  it('shows emoji placeholder when no images', () => {
    render(<ImageGallery name="Test Fabric" />);
    expect(screen.getByText('🧵')).toBeInTheDocument();
    expect(screen.getByText('Test Fabric')).toBeInTheDocument();
  });

  it('renders main image when images provided', () => {
    render(<ImageGallery images={['https://example.com/img.jpg']} name="Test" />);
    expect(screen.getByRole('img', { name: 'Test' })).toHaveAttribute('src', 'https://example.com/img.jpg');
  });

  it('uses thumbnailUrl as fallback when no images array', () => {
    render(<ImageGallery thumbnailUrl="https://example.com/thumb.jpg" name="Test" />);
    expect(screen.getByRole('img', { name: 'Test' })).toHaveAttribute('src', 'https://example.com/thumb.jpg');
  });

  it('does not show thumbnails when only one image', () => {
    render(<ImageGallery images={['https://example.com/img.jpg']} name="Test" />);
    expect(screen.queryByRole('list', { name: /fabric images/i })).not.toBeInTheDocument();
  });

  it('shows thumbnail strip when multiple images', () => {
    render(
      <ImageGallery
        images={['https://example.com/img1.jpg', 'https://example.com/img2.jpg']}
        name="Test"
      />
    );
    expect(screen.getByRole('list', { name: /fabric images/i })).toBeInTheDocument();
  });

  it('switches main image when thumbnail is clicked', async () => {
    const user = userEvent.setup();
    render(
      <ImageGallery
        images={['https://example.com/img1.jpg', 'https://example.com/img2.jpg']}
        name="Test"
      />
    );

    await user.click(screen.getByRole('button', { name: /view image 2/i }));

    const mainImg = screen.getAllByRole('img').find((img) => img.alt === 'Test');
    expect(mainImg).toHaveAttribute('src', 'https://example.com/img2.jpg');
  });

  it('shows zoom hint on main image', () => {
    render(<ImageGallery images={['https://example.com/img.jpg']} name="Test" />);
    expect(screen.getByText(/hover to zoom/i)).toBeInTheDocument();
  });

  it('has accessible label on main image container', () => {
    render(<ImageGallery images={['https://example.com/img.jpg']} name="Merino Wool" />);
    expect(screen.getByLabelText('Merino Wool swatch')).toBeInTheDocument();
  });
});
