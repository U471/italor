import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AdminFabricForm from './AdminFabricForm';

const MOCK_FABRIC = {
  _id: 'f1',
  name: 'Italian Merino Wool',
  material: 'wool',
  color: 'navy',
  pattern: 'solid',
  price: 320,
  weight: 280,
  origin: 'Italy',
  season: 'all-year',
  careInstructions: 'Dry clean only.',
  patternDescription: 'Solid navy.',
  tags: ['premium', 'italian'],
  stock: 50,
  isActive: true,
};

function renderForm(props = {}) {
  return render(
    <AdminFabricForm
      onSubmit={jest.fn()}
      onCancel={jest.fn()}
      {...props}
    />
  );
}

describe('AdminFabricForm', () => {
  it('renders create form with empty fields', () => {
    renderForm();
    expect(screen.getByLabelText(/^name/i)).toHaveValue('');
    expect(screen.getByLabelText(/^color/i)).toHaveValue('');
    expect(screen.getByRole('button', { name: /create fabric/i })).toBeInTheDocument();
  });

  it('renders edit form prefilled with fabric data', () => {
    renderForm({ initialValues: MOCK_FABRIC });
    expect(screen.getByLabelText(/^name/i)).toHaveValue('Italian Merino Wool');
    expect(screen.getByLabelText(/^color/i)).toHaveValue('navy');
    expect(screen.getByLabelText(/price/i)).toHaveValue(320);
    expect(screen.getByRole('button', { name: /update fabric/i })).toBeInTheDocument();
  });

  it('calls onCancel when Cancel button clicked', async () => {
    const onCancel = jest.fn();
    const user = userEvent.setup();
    renderForm({ onCancel });

    await user.click(screen.getByRole('button', { name: /cancel/i }));

    expect(onCancel).toHaveBeenCalled();
  });

  it('calls onSubmit with form values on submit', async () => {
    const onSubmit = jest.fn();
    const user = userEvent.setup();
    renderForm({ onSubmit });

    await user.clear(screen.getByLabelText(/^name/i));
    await user.type(screen.getByLabelText(/^name/i), 'New Fabric');
    await user.clear(screen.getByLabelText(/^color/i));
    await user.type(screen.getByLabelText(/^color/i), 'blue');
    await user.clear(screen.getByLabelText(/price/i));
    await user.type(screen.getByLabelText(/price/i), '200');

    await user.click(screen.getByRole('button', { name: /create fabric/i }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'New Fabric', color: 'blue', price: 200 })
    );
  });

  it('converts tags string to array on submit', async () => {
    const onSubmit = jest.fn();
    const user = userEvent.setup();
    renderForm({ onSubmit });

    await user.type(screen.getByLabelText(/tags/i), 'premium, italian, merino');
    await user.click(screen.getByRole('button', { name: /create fabric/i }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ tags: ['premium', 'italian', 'merino'] })
    );
  });

  it('shows error alert when error prop provided', () => {
    renderForm({ error: 'Something went wrong' });
    expect(screen.getByRole('alert')).toHaveTextContent('Something went wrong');
  });

  it('disables submit button while loading', () => {
    renderForm({ isLoading: true });
    expect(screen.getByRole('button', { name: /saving/i })).toBeDisabled();
  });

  it('renders material dropdown with all options', () => {
    renderForm();
    const select = screen.getByLabelText(/material/i);
    expect(select).toBeInTheDocument();
    fireEvent.change(select, { target: { value: 'cashmere' } });
    expect(select.value).toBe('cashmere');
  });

  it('renders isActive checkbox checked by default', () => {
    renderForm();
    expect(screen.getByLabelText(/active/i)).toBeChecked();
  });

  it('converts tags array to comma string in edit mode', () => {
    renderForm({ initialValues: MOCK_FABRIC });
    expect(screen.getByLabelText(/tags/i)).toHaveValue('premium, italian');
  });
});
