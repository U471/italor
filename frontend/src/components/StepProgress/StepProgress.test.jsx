import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import StepProgress from './StepProgress';

const STEPS = [
  { id: 'fabric', label: 'Fabric' },
  { id: 'style', label: 'Style' },
  { id: 'lapel', label: 'Lapel' },
];

function renderProgress(props = {}) {
  return render(
    <StepProgress
      steps={STEPS}
      currentStep={0}
      completedSteps={[]}
      {...props}
    />
  );
}

describe('StepProgress', () => {
  it('renders all step labels', () => {
    renderProgress();
    expect(screen.getByText('Fabric')).toBeInTheDocument();
    expect(screen.getByText('Style')).toBeInTheDocument();
    expect(screen.getByText('Lapel')).toBeInTheDocument();
  });

  it('marks active step with aria-current="step"', () => {
    renderProgress({ currentStep: 1 });
    const styleBtn = screen.getByRole('button', { name: /step 2: style/i });
    expect(styleBtn).toHaveAttribute('aria-current', 'step');
  });

  it('does not mark non-active steps with aria-current', () => {
    renderProgress({ currentStep: 0 });
    const styleBtn = screen.getByRole('button', { name: /step 2: style/i });
    expect(styleBtn).not.toHaveAttribute('aria-current');
  });

  it('shows checkmark for completed steps', () => {
    renderProgress({ currentStep: 1, completedSteps: [0] });
    const fabricBtn = screen.getByRole('button', { name: /step 1: fabric \(completed\)/i });
    expect(fabricBtn).toBeInTheDocument();
  });

  it('calls onStepClick when completed step is clicked', async () => {
    const onStepClick = jest.fn();
    const user = userEvent.setup();
    renderProgress({ currentStep: 1, completedSteps: [0], onStepClick });

    await user.click(screen.getByRole('button', { name: /step 1: fabric \(completed\)/i }));

    expect(onStepClick).toHaveBeenCalledWith(0);
  });

  it('does not call onStepClick for non-completed steps', async () => {
    const onStepClick = jest.fn();
    const user = userEvent.setup();
    renderProgress({ currentStep: 0, completedSteps: [], onStepClick });

    await user.click(screen.getByRole('button', { name: /step 2: style/i }));

    expect(onStepClick).not.toHaveBeenCalled();
  });

  it('renders nav with aria-label', () => {
    renderProgress();
    expect(screen.getByRole('navigation', { name: /configurator progress/i })).toBeInTheDocument();
  });

  it('disables buttons for incomplete steps', () => {
    renderProgress({ currentStep: 0, completedSteps: [] });
    const lapelBtn = screen.getByRole('button', { name: /step 3: lapel/i });
    expect(lapelBtn).toBeDisabled();
  });
});
