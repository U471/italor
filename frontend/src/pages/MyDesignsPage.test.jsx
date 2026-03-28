import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import MyDesignsPage from './MyDesignsPage';

jest.mock('../services/design.service', () => ({
  getDesigns: jest.fn(),
  deleteDesign: jest.fn(),
}));
import { getDesigns, deleteDesign } from '../services/design.service';

jest.mock('../store/suitStore', () => ({ __esModule: true, default: jest.fn() }));
import useSuitStore from '../store/suitStore';

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const mockLoadConfig = jest.fn();

const MOCK_DESIGNS = [
  { _id: 'd1', name: 'My Suit', suitConfig: { fabric: null }, createdAt: '2025-01-15T10:00:00Z', previewImageUrl: null },
  { _id: 'd2', name: 'Evening Wear', suitConfig: { fabric: null }, createdAt: '2025-02-20T10:00:00Z', previewImageUrl: 'http://example.com/img.jpg' },
];

function renderPage() {
  useSuitStore.mockReturnValue({ loadConfig: mockLoadConfig });
  return render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <MyDesignsPage />
    </MemoryRouter>
  );
}

beforeEach(() => jest.clearAllMocks());

describe('MyDesignsPage', () => {
  it('shows loading spinner initially', () => {
    getDesigns.mockReturnValue(new Promise(() => {})); // never resolves
    renderPage();
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('shows empty state when no designs exist', async () => {
    getDesigns.mockResolvedValue({ data: { data: { designs: [] } } });
    renderPage();
    expect(await screen.findByText(/no saved designs yet/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /start designing/i })).toBeInTheDocument();
  });

  it('navigates to /builder when Start Designing is clicked', async () => {
    getDesigns.mockResolvedValue({ data: { data: { designs: [] } } });
    renderPage();
    await screen.findByText(/no saved designs yet/i);
    fireEvent.click(screen.getByRole('button', { name: /start designing/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/builder');
  });

  it('renders design cards when designs exist', async () => {
    getDesigns.mockResolvedValue({ data: { data: { designs: MOCK_DESIGNS } } });
    renderPage();
    expect(await screen.findByText('My Suit')).toBeInTheDocument();
    expect(screen.getByText('Evening Wear')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /continue designing/i })).toHaveLength(2);
  });

  it('calls loadConfig and navigates when Continue Designing is clicked', async () => {
    getDesigns.mockResolvedValue({ data: { data: { designs: MOCK_DESIGNS } } });
    renderPage();
    const continueBtns = await screen.findAllByRole('button', { name: /continue designing/i });
    fireEvent.click(continueBtns[0]);
    expect(mockLoadConfig).toHaveBeenCalledWith(MOCK_DESIGNS[0].suitConfig);
    expect(mockNavigate).toHaveBeenCalledWith('/builder');
  });

  it('removes a design after delete', async () => {
    getDesigns.mockResolvedValue({ data: { data: { designs: MOCK_DESIGNS } } });
    deleteDesign.mockResolvedValue({});
    renderPage();
    await screen.findByText('My Suit');
    const deleteBtns = screen.getAllByRole('button', { name: /delete/i });
    fireEvent.click(deleteBtns[0]);
    await waitFor(() => expect(screen.queryByText('My Suit')).not.toBeInTheDocument());
    expect(deleteDesign).toHaveBeenCalledWith('d1');
  });

  it('shows designs count', async () => {
    getDesigns.mockResolvedValue({ data: { data: { designs: MOCK_DESIGNS } } });
    renderPage();
    expect(await screen.findByText(/2\/10 saved designs/i)).toBeInTheDocument();
  });

  it('falls back to empty list if getDesigns rejects', async () => {
    getDesigns.mockRejectedValue(new Error('Network error'));
    renderPage();
    expect(await screen.findByText(/no saved designs yet/i)).toBeInTheDocument();
  });
});
