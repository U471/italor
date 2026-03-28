import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import MonogramStep from './MonogramStep';

// Mock the suit store
jest.mock('../../store/suitStore', () => ({
  __esModule: true,
  default: jest.fn(),
}));

import useSuitStore from '../../store/suitStore';

const mockSetMonogram = jest.fn();

function buildStore(monogramOverride = {}) {
  return {
    config: {
      monogram: {
        text: '',
        font: 'serif',
        color: 'navy',
        placement: 'inner-pocket',
        enabled: true,
        ...monogramOverride,
      },
    },
    setMonogram: mockSetMonogram,
  };
}

function renderStep(monogramOverride = {}) {
  useSuitStore.mockReturnValue(buildStore(monogramOverride));
  return render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <MonogramStep />
    </MemoryRouter>
  );
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('MonogramStep', () => {
  it('renders heading and FREE badge', () => {
    renderStep();
    expect(screen.getByText(/Monogram & Personalization/i)).toBeInTheDocument();
    expect(screen.getByText('FREE')).toBeInTheDocument();
  });

  it('renders font selector with 5 options', () => {
    renderStep();
    expect(screen.getByText('Classic Serif')).toBeInTheDocument();
    expect(screen.getByText('Elegant Script')).toBeInTheDocument();
    expect(screen.getByText('Bold Block')).toBeInTheDocument();
    expect(screen.getByText('Italic')).toBeInTheDocument();
    expect(screen.getByText('Typewriter')).toBeInTheDocument();
  });

  it('renders placement options', () => {
    renderStep();
    expect(screen.getByText('Inner Breast Pocket')).toBeInTheDocument();
    expect(screen.getByText('Left Sleeve')).toBeInTheDocument();
    expect(screen.getByText('Collar')).toBeInTheDocument();
  });

  it('calls setMonogram when text is typed', () => {
    renderStep();
    const input = screen.getByPlaceholderText(/e.g. JRS/i);
    fireEvent.change(input, { target: { value: 'ABC' } });
    expect(mockSetMonogram).toHaveBeenCalledWith(
      expect.objectContaining({ text: 'ABC', enabled: true })
    );
  });

  it('shows skip message when enabled is false', () => {
    renderStep({ enabled: false });
    expect(screen.getByText(/No monogram/i)).toBeInTheDocument();
  });

  it('calls setMonogram with toggled enabled on skip toggle', () => {
    renderStep({ enabled: true });
    const toggle = screen.getByRole('switch');
    fireEvent.click(toggle);
    expect(mockSetMonogram).toHaveBeenCalledWith(
      expect.objectContaining({ enabled: false })
    );
  });

  it('calls setMonogram when a font is selected', () => {
    renderStep();
    fireEvent.click(screen.getByText('Bold Block'));
    expect(mockSetMonogram).toHaveBeenCalledWith(
      expect.objectContaining({ font: 'block' })
    );
  });

  it('calls setMonogram when a placement is selected', () => {
    renderStep();
    fireEvent.click(screen.getByText('Left Sleeve'));
    expect(mockSetMonogram).toHaveBeenCalledWith(
      expect.objectContaining({ placement: 'left-sleeve' })
    );
  });
});
