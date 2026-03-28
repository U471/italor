import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import LapelStep from './LapelStep';

jest.mock('../../store/suitStore', () => ({
  __esModule: true,
  default: jest.fn(),
}));

import useSuitStore from '../../store/suitStore';

const mockSetLapel = jest.fn();

function renderStep(lapel = null, styleId = 'single-2') {
  useSuitStore.mockReturnValue({
    config: { lapel, style: { id: styleId } },
    setLapel: mockSetLapel,
  });
  return render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <LapelStep />
    </MemoryRouter>
  );
}

beforeEach(() => jest.clearAllMocks());

describe('LapelStep — initial state', () => {
  it('renders all three lapel style cards', () => {
    renderStep();
    expect(screen.getByText('Notch Lapel')).toBeInTheDocument();
    expect(screen.getByText('Peak Lapel')).toBeInTheDocument();
    expect(screen.getByText('Shawl Lapel')).toBeInTheDocument();
  });

  it('shows prompt text when no style is selected', () => {
    renderStep();
    expect(screen.getByText(/select a lapel style above/i)).toBeInTheDocument();
  });

  it('does not render width selector initially', () => {
    renderStep();
    expect(screen.queryByText('Lapel Width')).not.toBeInTheDocument();
  });

  it('all style cards have aria-pressed="false" initially', () => {
    renderStep();
    const buttons = screen.getAllByRole('button', { name: /lapel/i });
    buttons.forEach((btn) => expect(btn).toHaveAttribute('aria-pressed', 'false'));
  });
});

describe('LapelStep — style selection', () => {
  it('calls setLapel with notch style and regular width', () => {
    renderStep();
    fireEvent.click(screen.getByText('Notch Lapel'));
    expect(mockSetLapel).toHaveBeenCalledWith({ style: 'notch', width: 'regular' });
  });

  it('calls setLapel with peak style and regular width', () => {
    renderStep();
    fireEvent.click(screen.getByText('Peak Lapel'));
    expect(mockSetLapel).toHaveBeenCalledWith({ style: 'peak', width: 'regular' });
  });

  it('calls setLapel with shawl style and regular width', () => {
    renderStep();
    fireEvent.click(screen.getByText('Shawl Lapel'));
    expect(mockSetLapel).toHaveBeenCalledWith({ style: 'shawl', width: 'regular' });
  });

  it('marks the selected style card as aria-pressed="true"', () => {
    renderStep({ style: 'peak', width: 'regular' });
    const peakBtn = screen.getByRole('button', { name: /peak lapel/i });
    expect(peakBtn).toHaveAttribute('aria-pressed', 'true');
  });

  it('switching style resets width to regular', () => {
    renderStep({ style: 'notch', width: 'wide' });
    fireEvent.click(screen.getByText('Peak Lapel'));
    expect(mockSetLapel).toHaveBeenCalledWith({ style: 'peak', width: 'regular' });
  });

  it('clicking the same style preserves current width', () => {
    renderStep({ style: 'notch', width: 'wide' });
    fireEvent.click(screen.getByText('Notch Lapel'));
    expect(mockSetLapel).toHaveBeenCalledWith({ style: 'notch', width: 'wide' });
  });
});

describe('LapelStep — width selector', () => {
  it('shows width selector after a style is chosen', () => {
    renderStep({ style: 'notch', width: 'regular' });
    expect(screen.getByText('Lapel Width')).toBeInTheDocument();
  });

  it('renders all three width options', () => {
    renderStep({ style: 'shawl', width: 'regular' });
    expect(screen.getByText('Narrow (6 cm)')).toBeInTheDocument();
    expect(screen.getByText('Regular (8 cm)')).toBeInTheDocument();
    expect(screen.getByText('Wide (10 cm)')).toBeInTheDocument();
  });

  it('marks the active width as aria-pressed="true"', () => {
    renderStep({ style: 'notch', width: 'wide' });
    expect(screen.getByRole('button', { name: /wide/i })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: /narrow/i })).toHaveAttribute('aria-pressed', 'false');
  });

  it('calls setLapel with updated width when width button clicked', () => {
    renderStep({ style: 'notch', width: 'regular' });
    fireEvent.click(screen.getByText('Wide (10 cm)'));
    expect(mockSetLapel).toHaveBeenCalledWith({ style: 'notch', width: 'wide' });
  });

  it('shows summary text with selected width and style', () => {
    renderStep({ style: 'shawl', width: 'narrow' });
    expect(screen.getByText(/narrow shawl lapel selected/i)).toBeInTheDocument();
  });
});
