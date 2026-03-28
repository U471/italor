import { render, screen, fireEvent } from '@testing-library/react';
import SizeChartModal from './SizeChartModal';

const mockOnApply = jest.fn();
const mockOnClose = jest.fn();

function renderModal() {
  return render(<SizeChartModal onApply={mockOnApply} onClose={mockOnClose} />);
}

beforeEach(() => jest.clearAllMocks());

describe('SizeChartModal', () => {
  it('renders the dialog with title', () => {
    renderModal();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Select Standard Size')).toBeInTheDocument();
  });

  it('renders all 7 size buttons', () => {
    renderModal();
    ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'].forEach((size) => {
      expect(screen.getAllByText(size).length).toBeGreaterThan(0);
    });
  });

  it('renders size chart table with correct columns', () => {
    renderModal();
    expect(screen.getByRole('table', { name: /standard size chart/i })).toBeInTheDocument();
  });

  it('renders all 15 measurement rows in the table', () => {
    renderModal();
    expect(screen.getByText('Chest (cm)')).toBeInTheDocument();
    expect(screen.getByText('Trouser Bottom (cm)')).toBeInTheDocument();
    expect(screen.getByText('Inseam (cm)')).toBeInTheDocument();
  });

  it('Apply button is disabled until a size is selected', () => {
    renderModal();
    const applyBtn = screen.getByRole('button', { name: /select a size/i });
    expect(applyBtn).toBeDisabled();
  });

  it('selecting a size enables the Apply button', () => {
    renderModal();
    // Click the size button in the grid (first occurrence is in the grid)
    const sizeButtons = screen.getAllByRole('button', { name: /^L$/i });
    fireEvent.click(sizeButtons[0]);
    expect(screen.getByRole('button', { name: /apply size L/i })).not.toBeDisabled();
  });

  it('calls onApply with the selected size when Apply is clicked', () => {
    renderModal();
    const sizeButtons = screen.getAllByRole('button', { name: /^M$/i });
    fireEvent.click(sizeButtons[0]);
    fireEvent.click(screen.getByRole('button', { name: /apply size M/i }));
    expect(mockOnApply).toHaveBeenCalledWith('M');
  });

  it('calls onClose when Cancel is clicked', () => {
    renderModal();
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when the X button is clicked', () => {
    renderModal();
    fireEvent.click(screen.getByRole('button', { name: /close size chart/i }));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });
});
