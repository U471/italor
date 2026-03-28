import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

jest.mock('../services/api', () => ({
  getFabricById: jest.fn(),
}));

import { getFabricById } from '../services/api';
import BuilderPage from './BuilderPage';

const MOCK_FABRIC = {
  _id: 'f1',
  name: 'Italian Merino Wool',
  material: 'wool',
  color: 'navy',
  price: 320,
  thumbnailUrl: null,
};

function renderBuilder(path = '/builder') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/builder" element={<BuilderPage />} />
        <Route path="/fabrics" element={<div>Fabric catalog</div>} />
      </Routes>
    </MemoryRouter>
  );
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('BuilderPage', () => {
  it('renders the configurator heading', () => {
    renderBuilder();
    expect(screen.getByText(/suit configurator/i)).toBeInTheDocument();
  });

  it('renders the step progress bar with all 7 steps', () => {
    renderBuilder();
    const nav = screen.getByRole('navigation', { name: /configurator progress/i });
    expect(nav).toBeInTheDocument();
    // Each step renders as a button in the nav
    expect(screen.getByRole('button', { name: /step 1: fabric/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /step 2: style/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /step 3: lapel/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /step 4: lining/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /step 5: details/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /step 6: monogram/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /step 7: review/i })).toBeInTheDocument();
  });

  it('starts on the Fabric step (step 1)', () => {
    renderBuilder();
    expect(screen.getByRole('heading', { level: 2, name: 'Fabric' })).toBeInTheDocument();
  });

  it('shows Browse Fabrics link when no fabric selected', () => {
    renderBuilder();
    expect(screen.getByRole('link', { name: /browse fabrics/i })).toBeInTheDocument();
  });

  it('pre-loads fabric from ?fabric= query param', async () => {
    getFabricById.mockResolvedValue({ fabric: MOCK_FABRIC });
    renderBuilder('/builder?fabric=f1');

    await waitFor(() => expect(getFabricById).toHaveBeenCalledWith('f1'));
    expect(await screen.findByText('Italian Merino Wool')).toBeInTheDocument();
  });

  it('shows Change fabric link when fabric is loaded', async () => {
    getFabricById.mockResolvedValue({ fabric: MOCK_FABRIC });
    renderBuilder('/builder?fabric=f1');

    expect(await screen.findByRole('link', { name: /change fabric/i })).toBeInTheDocument();
  });

  it('Previous button is disabled on first step', () => {
    renderBuilder();
    expect(screen.getByRole('button', { name: /← previous/i })).toBeDisabled();
  });

  it('Next button navigates to the next step', async () => {
    const user = userEvent.setup();
    renderBuilder();

    await user.click(screen.getByRole('button', { name: /next →/i }));

    expect(screen.getByRole('heading', { level: 2, name: 'Style' })).toBeInTheDocument();
  });

  it('Previous button navigates back to the previous step', async () => {
    const user = userEvent.setup();
    renderBuilder();

    await user.click(screen.getByRole('button', { name: /next →/i }));
    await user.click(screen.getByRole('button', { name: /← previous/i }));

    expect(screen.getByRole('heading', { level: 2, name: 'Fabric' })).toBeInTheDocument();
  });

  it('shows "Add to Cart" button on the last step', async () => {
    const user = userEvent.setup();
    renderBuilder();

    // Navigate to last step (6 clicks)
    for (let i = 0; i < 6; i++) {
      await user.click(screen.getByRole('button', { name: /next →/i }));
    }

    expect(screen.getByRole('button', { name: /add to cart/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /next →/i })).not.toBeInTheDocument();
  });

  it('shows Review step with fabric info when on last step', async () => {
    getFabricById.mockResolvedValue({ fabric: MOCK_FABRIC });
    const user = userEvent.setup();
    renderBuilder('/builder?fabric=f1');

    await screen.findByText('Italian Merino Wool');

    for (let i = 0; i < 6; i++) {
      await user.click(screen.getByRole('button', { name: /next →/i }));
    }

    expect(screen.getByRole('heading', { level: 2, name: 'Review' })).toBeInTheDocument();
    expect(screen.getAllByText('Italian Merino Wool').length).toBeGreaterThan(0);
  });

  it('renders iTailor home link in header', () => {
    renderBuilder();
    expect(screen.getByRole('link', { name: 'iTailor' })).toHaveAttribute('href', '/');
  });
});
