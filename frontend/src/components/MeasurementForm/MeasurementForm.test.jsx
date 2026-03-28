import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import MeasurementForm from './MeasurementForm';

jest.mock('../../store/suitStore', () => ({ __esModule: true, default: jest.fn() }));
jest.mock('../../store/authStore', () => ({ __esModule: true, default: jest.fn() }));
jest.mock('../../services/measurement.service', () => ({
  getProfiles: jest.fn().mockResolvedValue({ data: { data: { profiles: [] } } }),
  saveProfile: jest.fn(),
}));

import useSuitStore from '../../store/suitStore';
import useAuthStore from '../../store/authStore';

const mockSetMeasurements = jest.fn();

function renderForm(measurementsOverride = null) {
  useSuitStore.mockReturnValue({
    config: { measurements: measurementsOverride },
    setMeasurements: mockSetMeasurements,
  });
  useAuthStore.mockImplementation((selector) =>
    selector ? selector({ accessToken: null }) : { accessToken: null }
  );
  return render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <MeasurementForm />
    </MemoryRouter>
  );
}

beforeEach(() => jest.clearAllMocks());

describe('MeasurementForm', () => {
  it('renders Jacket and Trousers sections', () => {
    renderForm();
    expect(screen.getByText('Jacket Measurements')).toBeInTheDocument();
    expect(screen.getByText('Trouser Measurements')).toBeInTheDocument();
  });

  it('renders all 15 measurement fields', () => {
    renderForm();
    expect(screen.getByRole('spinbutton', { name: /^Chest$/i })).toBeInTheDocument();
    expect(screen.getByRole('spinbutton', { name: /^Inseam$/i })).toBeInTheDocument();
    expect(screen.getByRole('spinbutton', { name: /^Trouser Bottom$/i })).toBeInTheDocument();
  });

  it('renders cm/inches unit toggle', () => {
    renderForm();
    expect(screen.getByRole('button', { name: 'cm' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'inches' })).toBeInTheDocument();
  });

  it('renders fit preference options', () => {
    renderForm();
    expect(screen.getByText('Slim Fit')).toBeInTheDocument();
    expect(screen.getByText('Regular Fit')).toBeInTheDocument();
    expect(screen.getByText('Comfort Fit')).toBeInTheDocument();
  });

  it('shows help tooltip when help button clicked', () => {
    renderForm();
    const helpBtns = screen.getAllByRole('button', { name: /help for/i });
    fireEvent.click(helpBtns[0]); // chest help
    expect(screen.getByText(/fullest part of your chest/i)).toBeInTheDocument();
  });

  it('shows validation error on blur with out-of-range value', () => {
    renderForm();
    const chestInput = screen.getByRole('spinbutton', { name: /^Chest$/i });
    fireEvent.change(chestInput, { target: { value: '300' } });
    fireEvent.blur(chestInput);
    expect(screen.getByText(/Please enter a value between/i)).toBeInTheDocument();
  });

  it('opens SizeChartModal when "Use Standard Size" is clicked', () => {
    renderForm();
    fireEvent.click(screen.getByRole('button', { name: /use standard size/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Select Standard Size')).toBeInTheDocument();
  });

  it('applies standard size and pre-fills fields', async () => {
    renderForm();
    fireEvent.click(screen.getByRole('button', { name: /use standard size/i }));
    // Select L in the grid (first occurrence is the size button)
    const sizeButtons = screen.getAllByRole('button', { name: /^L$/i });
    fireEvent.click(sizeButtons[0]);
    fireEvent.click(screen.getByRole('button', { name: /apply size L/i }));
    // Modal should close, size notice shown
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(screen.getByText(/standard L applied/i)).toBeInTheDocument();
  });

  it('calls setMeasurements with measurementType standard after applying size', async () => {
    renderForm();
    // Apply L size
    fireEvent.click(screen.getByRole('button', { name: /use standard size/i }));
    const sizeButtons = screen.getAllByRole('button', { name: /^L$/i });
    fireEvent.click(sizeButtons[0]);
    fireEvent.click(screen.getByRole('button', { name: /apply size L/i }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    // Now save
    const saveBtn = screen.getByRole('button', { name: /save measurements/i });
    fireEvent.click(saveBtn);
    expect(mockSetMeasurements).toHaveBeenCalledWith(
      expect.objectContaining({ measurementType: 'standard' })
    );
  });

  it('calls setMeasurements when Save is clicked with valid data', () => {
    renderForm();
    // Fill each field with its mid-range value (cm)
    const validValues = {
      chest: '100', waist: '90', hips: '100', shoulders: '45', neck: '38',
      sleeveLength: '65', bicep: '35', wrist: '18', jacketLength: '75', backLength: '44',
      inseam: '80', outseam: '105', thigh: '60', knee: '42', trouserBottom: '38',
    };
    const allInputs = screen.getAllByRole('spinbutton');
    const fieldOrder = [
      'chest', 'waist', 'hips', 'shoulders', 'neck',
      'sleeveLength', 'bicep', 'wrist', 'jacketLength', 'backLength',
      'inseam', 'outseam', 'thigh', 'knee', 'trouserBottom',
    ];
    allInputs.forEach((input, idx) => {
      const fieldId = fieldOrder[idx];
      fireEvent.change(input, { target: { value: validValues[fieldId] } });
      fireEvent.blur(input);
    });
    const saveBtn = screen.getByRole('button', { name: /save measurements/i });
    fireEvent.click(saveBtn);
    expect(mockSetMeasurements).toHaveBeenCalled();
  });
});
