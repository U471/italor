import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import SuitPreviewPanel from './SuitPreviewPanel';

jest.mock('../../store/suitStore', () => ({
  __esModule: true,
  default: jest.fn(),
}));

import useSuitStore from '../../store/suitStore';

function buildConfig(overrides = {}) {
  return {
    fabric: { _id: 'f1', name: 'Navy Wool', material: 'wool', color: 'navy', price: 120 },
    style: { breasting: 'single', buttons: 2 },
    lapel: { style: 'notch', width: 'regular' },
    lining: { color: 'navy', type: 'full' },
    details: { buttonMaterial: 'horn', pocketStyle: 'flap', ventStyle: 'double' },
    monogram: { text: 'JRS', font: 'serif', position: 'inner-pocket' },
    ...overrides,
  };
}

function renderPanel(configOverrides = {}, props = {}) {
  useSuitStore.mockReturnValue({ config: buildConfig(configOverrides) });
  return render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <SuitPreviewPanel {...props} />
    </MemoryRouter>
  );
}

beforeEach(() => jest.clearAllMocks());

describe('SuitPreviewPanel', () => {
  it('renders front/back toggle buttons', () => {
    renderPanel();
    expect(screen.getByText('Front View')).toBeInTheDocument();
    expect(screen.getByText('Back View')).toBeInTheDocument();
  });

  it('switches to back view on click', () => {
    renderPanel();
    const backBtn = screen.getByText('Back View');
    fireEvent.click(backBtn);
    expect(backBtn).toHaveClass('bg-gray-900');
  });

  it('renders suit SVG with aria-label', () => {
    renderPanel();
    expect(screen.getByRole('img', { name: /suit preview/i })).toBeInTheDocument();
  });

  it('shows config summary when 4+ items configured', () => {
    renderPanel();
    expect(screen.getByText('Your Configuration')).toBeInTheDocument();
    expect(screen.getByText('Style')).toBeInTheDocument();
  });

  it('shows monogram text in summary', () => {
    renderPanel();
    // monogram text appears in SVG and/or summary
    expect(screen.getAllByText('JRS').length).toBeGreaterThan(0);
  });

  it('hides monogram SVG text when monogram text is empty', () => {
    renderPanel({ monogram: { text: '', font: 'serif', position: 'inner-pocket' } });
    // No 'JRS' text should appear
    expect(screen.queryByText('JRS')).not.toBeInTheDocument();
  });

  it('renders compact thumbnail in compact mode', () => {
    renderPanel({}, { compact: true });
    expect(screen.getByText('Preview')).toBeInTheDocument();
  });

  it('expands to full screen on Preview click in compact mode', () => {
    renderPanel({}, { compact: true });
    fireEvent.click(screen.getByText('Preview'));
    expect(screen.getByText('Suit Preview')).toBeInTheDocument();
    expect(screen.getByText('Close')).toBeInTheDocument();
  });
});
