import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ReviewForm from './ReviewForm';

const DEFAULT_PROPS = {
  fabricName: 'Italian Merino Wool',
  orderNumber: 'IT-202601-AB12CD',
  onSubmit: jest.fn(),
  isSubmitting: false,
  submitError: '',
  onCancel: null,
};

beforeEach(() => jest.clearAllMocks());

describe('ReviewForm', () => {
  it('renders fabric name and order number as context', () => {
    render(<ReviewForm {...DEFAULT_PROPS} />);
    expect(screen.getByText('Italian Merino Wool')).toBeInTheDocument();
    expect(screen.getByText(/IT-202601-AB12CD/)).toBeInTheDocument();
  });

  it('renders quality and fit rating star inputs', () => {
    render(<ReviewForm {...DEFAULT_PROPS} />);
    expect(screen.getByText(/Overall Quality Rating/i)).toBeInTheDocument();
    expect(screen.getByText(/Fit Rating/i)).toBeInTheDocument();
  });

  it('renders title and body text inputs', () => {
    render(<ReviewForm {...DEFAULT_PROPS} />);
    expect(screen.getByLabelText(/Review Title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Review \(optional/i)).toBeInTheDocument();
  });

  it('shows a validation error when submitting without a rating', async () => {
    render(<ReviewForm {...DEFAULT_PROPS} />);
    fireEvent.click(screen.getByRole('button', { name: /submit review/i }));
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText(/please select a star rating/i)).toBeInTheDocument();
    });
    expect(DEFAULT_PROPS.onSubmit).not.toHaveBeenCalled();
  });

  it('shows a validation error when body is shorter than 20 chars', async () => {
    render(<ReviewForm {...DEFAULT_PROPS} />);
    // Select 5 stars for rating
    fireEvent.click(screen.getByTestId('star-quality-5'));
    fireEvent.change(screen.getByLabelText(/Review \(optional/i), { target: { value: 'Too short' } });
    fireEvent.click(screen.getByRole('button', { name: /submit review/i }));
    await waitFor(() => {
      expect(screen.getByText(/at least 20 characters/i)).toBeInTheDocument();
    });
    expect(DEFAULT_PROPS.onSubmit).not.toHaveBeenCalled();
  });

  it('calls onSubmit with correct payload when form is valid', async () => {
    DEFAULT_PROPS.onSubmit.mockResolvedValue(undefined);
    render(<ReviewForm {...DEFAULT_PROPS} />);

    // Select rating
    fireEvent.click(screen.getByTestId('star-quality-4'));
    // Enter body
    fireEvent.change(screen.getByLabelText(/Review \(optional/i), {
      target: { value: 'This fabric is absolutely wonderful and well worth the price paid.' },
    });

    fireEvent.click(screen.getByRole('button', { name: /submit review/i }));

    await waitFor(() => {
      expect(DEFAULT_PROPS.onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ rating: 4, body: expect.stringContaining('wonderful') })
      );
    });
  });

  it('displays the submit error message from props', () => {
    render(<ReviewForm {...DEFAULT_PROPS} submitError="You have already reviewed this item." />);
    expect(screen.getByRole('alert')).toHaveTextContent('You have already reviewed this item.');
  });

  it('shows a loading state on the submit button when isSubmitting is true', () => {
    render(<ReviewForm {...DEFAULT_PROPS} isSubmitting />);
    const btn = screen.getByRole('button', { name: /submitting/i });
    expect(btn).toBeDisabled();
    expect(btn).toHaveTextContent('Submitting...');
  });

  it('renders Cancel button and calls onCancel when clicked', () => {
    const onCancel = jest.fn();
    render(<ReviewForm {...DEFAULT_PROPS} onCancel={onCancel} />);
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('does not render Cancel button when onCancel is not provided', () => {
    render(<ReviewForm {...DEFAULT_PROPS} onCancel={null} />);
    expect(screen.queryByRole('button', { name: /cancel/i })).not.toBeInTheDocument();
  });

  it('updates body character count display as user types', () => {
    render(<ReviewForm {...DEFAULT_PROPS} />);
    const textarea = screen.getByLabelText(/Review \(optional/i);
    fireEvent.change(textarea, { target: { value: 'Hello world test' } });
    expect(screen.getByText(/16 \/ 2000/)).toBeInTheDocument();
  });
});
