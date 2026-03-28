import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import MyMeasurementsPage from './MyMeasurementsPage';

jest.mock('../services/measurement.service', () => ({
  getProfiles: jest.fn(),
  updateProfile: jest.fn(),
  deleteProfile: jest.fn(),
}));

import { getProfiles, updateProfile, deleteProfile } from '../services/measurement.service';

const MOCK_PROFILES = [
  { _id: '1', name: 'My Regular Fit', isDefault: true, measurements: { fitPreference: 'regular' }, createdAt: '2026-01-01T00:00:00Z' },
  { _id: '2', name: 'Slim Summer', isDefault: false, measurements: { fitPreference: 'slim' }, createdAt: '2026-02-01T00:00:00Z' },
];

function renderPage() {
  return render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <MyMeasurementsPage />
    </MemoryRouter>
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  getProfiles.mockResolvedValue({ data: { data: { profiles: MOCK_PROFILES } } });
});

describe('MyMeasurementsPage', () => {
  it('shows loading spinner initially', () => {
    renderPage();
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('renders profile names after loading', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('My Regular Fit')).toBeInTheDocument());
    expect(screen.getByText('Slim Summer')).toBeInTheDocument();
  });

  it('shows Default badge on default profile', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Default')).toBeInTheDocument());
  });

  it('shows Set Default button on non-default profile', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Set Default')).toBeInTheDocument());
  });

  it('calls updateProfile on Set Default click', async () => {
    updateProfile.mockResolvedValue({ data: { data: { profile: { ...MOCK_PROFILES[1], isDefault: true } } } });
    renderPage();
    await waitFor(() => screen.getByText('Set Default'));
    fireEvent.click(screen.getByText('Set Default'));
    await waitFor(() => expect(updateProfile).toHaveBeenCalledWith('2', { isDefault: true }));
  });

  it('calls deleteProfile and removes profile on Delete', async () => {
    deleteProfile.mockResolvedValue({});
    renderPage();
    await waitFor(() => screen.getAllByText('Delete'));
    fireEvent.click(screen.getAllByText('Delete')[0]);
    await waitFor(() => expect(deleteProfile).toHaveBeenCalled());
  });

  it('shows empty state when no profiles', async () => {
    getProfiles.mockResolvedValue({ data: { data: { profiles: [] } } });
    renderPage();
    await waitFor(() => expect(screen.getByText(/No measurement profiles saved yet/i)).toBeInTheDocument());
  });
});
