import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FilterSidebar from './FilterSidebar';

const OPTIONS = {
  materials: ['wool', 'cotton', 'linen'],
  colors: ['navy', 'white', 'charcoal'],
  patterns: ['solid', 'herringbone', 'striped'],
};

const EMPTY_FILTERS = { material: '', color: '', pattern: '', minPrice: '', maxPrice: '' };

function renderSidebar({ filters = EMPTY_FILTERS, onChange = jest.fn(), onReset = jest.fn() } = {}) {
  return render(
    <FilterSidebar filters={filters} options={OPTIONS} onChange={onChange} onReset={onReset} />
  );
}

describe('FilterSidebar', () => {
  it('renders without crashing', () => {
    renderSidebar();
    expect(screen.getByRole('complementary', { name: /filter sidebar/i })).toBeInTheDocument();
  });

  it('renders all material options', () => {
    renderSidebar();
    expect(screen.getByRole('button', { name: 'wool' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'cotton' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'linen' })).toBeInTheDocument();
  });

  it('renders price range inputs', () => {
    renderSidebar();
    expect(screen.getByLabelText(/minimum price/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/maximum price/i)).toBeInTheDocument();
  });

  it('calls onChange when a material is selected', async () => {
    const onChange = jest.fn();
    const user = userEvent.setup();
    renderSidebar({ onChange });

    await user.click(screen.getByRole('button', { name: 'wool' }));

    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ material: 'wool', page: '1' }));
  });

  it('deselects a material when clicked again', async () => {
    const onChange = jest.fn();
    const user = userEvent.setup();
    renderSidebar({ filters: { ...EMPTY_FILTERS, material: 'wool' }, onChange });

    await user.click(screen.getByRole('button', { name: 'wool' }));

    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ material: '' }));
  });

  it('calls onChange when min price is entered', () => {
    const onChange = jest.fn();
    renderSidebar({ onChange });

    fireEvent.change(screen.getByLabelText(/minimum price/i), { target: { value: '100' } });

    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ minPrice: '100' }));
  });

  it('shows Clear all button when filters are active', () => {
    renderSidebar({ filters: { ...EMPTY_FILTERS, material: 'wool' } });
    expect(screen.getByRole('button', { name: /clear all/i })).toBeInTheDocument();
  });

  it('hides Clear all button when no filters are active', () => {
    renderSidebar();
    expect(screen.queryByRole('button', { name: /clear all/i })).not.toBeInTheDocument();
  });

  it('calls onReset when Clear all is clicked', async () => {
    const onReset = jest.fn();
    const user = userEvent.setup();
    renderSidebar({ filters: { ...EMPTY_FILTERS, material: 'wool' }, onReset });

    await user.click(screen.getByRole('button', { name: /clear all/i }));

    expect(onReset).toHaveBeenCalled();
  });
});
