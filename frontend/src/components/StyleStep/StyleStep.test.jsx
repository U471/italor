import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import StyleStep from './StyleStep';

jest.mock('../../store/suitStore', () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock('../../constants/suitStyles', () => ({
  SUIT_STYLES: [
    {
      id: 'single-2',
      label: 'Single Breasted 2-Button',
      description: 'The most versatile and classic choice.',
      previewImageUrl: '/test/single-2.png',
    },
    {
      id: 'double-6',
      label: 'Double Breasted 6-Button',
      description: 'The most formal double breasted option.',
      previewImageUrl: '/test/double-6.png',
    },
    {
      id: 'tuxedo',
      label: 'Tuxedo',
      description: 'Evening wear perfection.',
      previewImageUrl: '/test/tuxedo.png',
      tuxedoNote: 'Shawl lapel is recommended for this style.',
    },
  ],
}));

import useSuitStore from '../../store/suitStore';

const mockSetStyle = jest.fn();

function renderStep(style = null) {
  useSuitStore.mockReturnValue({
    config: { style },
    setStyle: mockSetStyle,
  });
  return render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <StyleStep />
    </MemoryRouter>
  );
}

beforeEach(() => jest.clearAllMocks());

describe('StyleStep — initial state', () => {
  it('renders all style option buttons', () => {
    renderStep();
    expect(screen.getByRole('button', { name: /single breasted 2-button/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /double breasted 6-button/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /tuxedo/i })).toBeInTheDocument();
  });

  it('all buttons have aria-pressed="false" when no style is selected', () => {
    renderStep();
    const buttons = screen.getAllByRole('button');
    buttons.forEach((btn) => expect(btn).toHaveAttribute('aria-pressed', 'false'));
  });

  it('shows "Select a style above to continue" hint initially', () => {
    renderStep();
    expect(screen.getByText(/select a style above to continue/i)).toBeInTheDocument();
  });

  it('renders preview images for each style', () => {
    renderStep();
    expect(screen.getByAltText('Single Breasted 2-Button')).toBeInTheDocument();
    expect(screen.getByAltText('Double Breasted 6-Button')).toBeInTheDocument();
    expect(screen.getByAltText('Tuxedo')).toBeInTheDocument();
  });
});

describe('StyleStep — style selection', () => {
  it('calls setStyle with id and label when a style is clicked', () => {
    renderStep();
    fireEvent.click(screen.getByRole('button', { name: /single breasted 2-button/i }));
    expect(mockSetStyle).toHaveBeenCalledWith({
      id: 'single-2',
      label: 'Single Breasted 2-Button',
    });
  });

  it('calls setStyle with correct values when double breasted is clicked', () => {
    renderStep();
    fireEvent.click(screen.getByRole('button', { name: /double breasted 6-button/i }));
    expect(mockSetStyle).toHaveBeenCalledWith({
      id: 'double-6',
      label: 'Double Breasted 6-Button',
    });
  });

  it('marks the selected style button as aria-pressed="true"', () => {
    renderStep({ id: 'double-6', label: 'Double Breasted 6-Button' });
    const btn = screen.getByRole('button', { name: /double breasted 6-button/i });
    expect(btn).toHaveAttribute('aria-pressed', 'true');
  });

  it('leaves unselected buttons as aria-pressed="false"', () => {
    renderStep({ id: 'single-2', label: 'Single Breasted 2-Button' });
    const doubleBtn = screen.getByRole('button', { name: /double breasted 6-button/i });
    expect(doubleBtn).toHaveAttribute('aria-pressed', 'false');
  });

  it('hides the hint text once a style is selected', () => {
    renderStep({ id: 'single-2', label: 'Single Breasted 2-Button' });
    expect(screen.queryByText(/select a style above to continue/i)).not.toBeInTheDocument();
  });
});

describe('StyleStep — tuxedo note', () => {
  it('shows tuxedoNote text for the tuxedo option', () => {
    renderStep();
    expect(screen.getByText(/shawl lapel is recommended for this style/i)).toBeInTheDocument();
  });

  it('does not show tuxedoNote for non-tuxedo styles', () => {
    renderStep();
    const singleBtn = screen.getByRole('button', { name: /single breasted 2-button/i });
    expect(singleBtn).not.toHaveTextContent(/shawl lapel/i);
  });
});
