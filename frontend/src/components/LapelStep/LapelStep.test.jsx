import { render, screen, fireEvent } from '@testing-library/react';
import LapelStep from './LapelStep';
import useSuitStore from '../../store/suitStore';

jest.mock('../../store/suitStore');

const mockSetLapel = jest.fn();

function buildStore(lapel = null) {
  useSuitStore.mockReturnValue({
    config: { lapel },
    setLapel: mockSetLapel,
  });
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('LapelStep — initial state', () => {
  it('renders all three lapel style cards', () => {
    buildStore();
    render(<LapelStep />);
    expect(screen.getByText('Notch Lapel')).toBeInTheDocument();
    expect(screen.getByText('Peak Lapel')).toBeInTheDocument();
    expect(screen.getByText('Shawl Lapel')).toBeInTheDocument();
  });

  it('shows prompt text when no style is selected', () => {
    buildStore();
    render(<LapelStep />);
    expect(screen.getByText(/select a lapel style above/i)).toBeInTheDocument();
  });

  it('does not render width selector initially', () => {
    buildStore();
    render(<LapelStep />);
    expect(screen.queryByText('Lapel Width')).not.toBeInTheDocument();
  });

  it('all style cards have aria-pressed="false" initially', () => {
    buildStore();
    render(<LapelStep />);
    const buttons = screen.getAllByRole('button', { name: /lapel/i });
    buttons.forEach((btn) => expect(btn).toHaveAttribute('aria-pressed', 'false'));
  });
});

describe('LapelStep — style selection', () => {
  it('calls setLapel with notch style and standard width', () => {
    buildStore();
    render(<LapelStep />);
    fireEvent.click(screen.getByText('Notch Lapel'));
    expect(mockSetLapel).toHaveBeenCalledWith({ style: 'notch', width: 'standard' });
  });

  it('calls setLapel with peak style and standard width', () => {
    buildStore();
    render(<LapelStep />);
    fireEvent.click(screen.getByText('Peak Lapel'));
    expect(mockSetLapel).toHaveBeenCalledWith({ style: 'peak', width: 'standard' });
  });

  it('calls setLapel with shawl style and standard width', () => {
    buildStore();
    render(<LapelStep />);
    fireEvent.click(screen.getByText('Shawl Lapel'));
    expect(mockSetLapel).toHaveBeenCalledWith({ style: 'shawl', width: 'standard' });
  });

  it('marks the selected style card as aria-pressed="true"', () => {
    buildStore({ style: 'peak', width: 'standard' });
    render(<LapelStep />);
    const peakBtn = screen.getByRole('button', { name: /peak lapel/i });
    expect(peakBtn).toHaveAttribute('aria-pressed', 'true');
  });

  it('switching style resets width to standard', () => {
    buildStore({ style: 'notch', width: 'wide' });
    render(<LapelStep />);
    fireEvent.click(screen.getByText('Peak Lapel'));
    expect(mockSetLapel).toHaveBeenCalledWith({ style: 'peak', width: 'standard' });
  });

  it('clicking the same style preserves current width', () => {
    buildStore({ style: 'notch', width: 'wide' });
    render(<LapelStep />);
    fireEvent.click(screen.getByText('Notch Lapel'));
    expect(mockSetLapel).toHaveBeenCalledWith({ style: 'notch', width: 'wide' });
  });
});

describe('LapelStep — width selector', () => {
  it('shows width selector after a style is chosen', () => {
    buildStore({ style: 'notch', width: 'standard' });
    render(<LapelStep />);
    expect(screen.getByText('Lapel Width')).toBeInTheDocument();
  });

  it('renders all three width options', () => {
    buildStore({ style: 'shawl', width: 'standard' });
    render(<LapelStep />);
    expect(screen.getByText('Narrow')).toBeInTheDocument();
    expect(screen.getByText('Standard')).toBeInTheDocument();
    expect(screen.getByText('Wide')).toBeInTheDocument();
  });

  it('shows cm hints for each width option', () => {
    buildStore({ style: 'notch', width: 'standard' });
    render(<LapelStep />);
    expect(screen.getByText('< 7 cm')).toBeInTheDocument();
    expect(screen.getByText('7–9 cm')).toBeInTheDocument();
    expect(screen.getByText('> 9 cm')).toBeInTheDocument();
  });

  it('marks the active width as aria-pressed="true"', () => {
    buildStore({ style: 'notch', width: 'wide' });
    render(<LapelStep />);
    expect(screen.getByRole('button', { name: /wide/i })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: /narrow/i })).toHaveAttribute('aria-pressed', 'false');
  });

  it('calls setLapel with updated width when width button clicked', () => {
    buildStore({ style: 'notch', width: 'standard' });
    render(<LapelStep />);
    fireEvent.click(screen.getByText('Wide'));
    expect(mockSetLapel).toHaveBeenCalledWith({ style: 'notch', width: 'wide' });
  });

  it('shows summary text with selected width and style', () => {
    buildStore({ style: 'shawl', width: 'narrow' });
    render(<LapelStep />);
    expect(screen.getByText(/narrow shawl lapel selected/i)).toBeInTheDocument();
  });
});
