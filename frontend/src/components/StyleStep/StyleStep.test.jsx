import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import StyleStep from './StyleStep';
import useSuitStore from '../../store/suitStore';

function renderStep() {
  return render(<StyleStep />);
}

beforeEach(() => {
  useSuitStore.getState().reset();
});

describe('StyleStep', () => {
  it('renders both breasting option buttons', () => {
    renderStep();
    expect(screen.getByRole('button', { name: /single breasted/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /double breasted/i })).toBeInTheDocument();
  });

  it('neither option is pressed initially', () => {
    renderStep();
    expect(screen.getByRole('button', { name: /single breasted/i })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('button', { name: /double breasted/i })).toHaveAttribute('aria-pressed', 'false');
  });

  it('does not show button count selector before a style is chosen', () => {
    renderStep();
    expect(screen.queryByText(/number of buttons/i)).not.toBeInTheDocument();
  });

  it('shows "Select a style above to continue" hint initially', () => {
    renderStep();
    expect(screen.getByText(/select a style above to continue/i)).toBeInTheDocument();
  });

  it('marks single breasted as pressed after clicking it', async () => {
    const user = userEvent.setup();
    renderStep();

    await user.click(screen.getByRole('button', { name: /single breasted/i }));

    expect(screen.getByRole('button', { name: /single breasted/i })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: /double breasted/i })).toHaveAttribute('aria-pressed', 'false');
  });

  it('marks double breasted as pressed after clicking it', async () => {
    const user = userEvent.setup();
    renderStep();

    await user.click(screen.getByRole('button', { name: /double breasted/i }));

    expect(screen.getByRole('button', { name: /double breasted/i })).toHaveAttribute('aria-pressed', 'true');
  });

  it('shows button count options for single breasted (1, 2, 3)', async () => {
    const user = userEvent.setup();
    renderStep();

    await user.click(screen.getByRole('button', { name: /single breasted/i }));

    expect(screen.getByText(/number of buttons/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '1' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '2' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '3' })).toBeInTheDocument();
  });

  it('shows button count options for double breasted (4, 6)', async () => {
    const user = userEvent.setup();
    renderStep();

    await user.click(screen.getByRole('button', { name: /double breasted/i }));

    expect(screen.getByText(/number of buttons/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '4' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '6' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '3' })).not.toBeInTheDocument();
  });

  it('sets default button count (2) when single breasted is selected', async () => {
    const user = userEvent.setup();
    renderStep();

    await user.click(screen.getByRole('button', { name: /single breasted/i }));

    expect(useSuitStore.getState().config.style).toEqual({ breasting: 'single', buttons: 2 });
  });

  it('sets default button count (6) when double breasted is selected', async () => {
    const user = userEvent.setup();
    renderStep();

    await user.click(screen.getByRole('button', { name: /double breasted/i }));

    expect(useSuitStore.getState().config.style).toEqual({ breasting: 'double', buttons: 6 });
  });

  it('updates button count when a different count is clicked', async () => {
    const user = userEvent.setup();
    renderStep();

    await user.click(screen.getByRole('button', { name: /single breasted/i }));
    await user.click(screen.getByRole('button', { name: '1' }));

    expect(useSuitStore.getState().config.style.buttons).toBe(1);
  });

  it('marks the selected button count as pressed', async () => {
    const user = userEvent.setup();
    renderStep();

    await user.click(screen.getByRole('button', { name: /single breasted/i }));
    await user.click(screen.getByRole('button', { name: '3' }));

    expect(screen.getByRole('button', { name: '3' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: '1' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('shows selection summary text after choosing style and buttons', async () => {
    const user = userEvent.setup();
    renderStep();

    await user.click(screen.getByRole('button', { name: /single breasted/i }));

    expect(screen.getByText(/2-button single-breasted selected/i)).toBeInTheDocument();
  });

  it('resets button count to new default when switching breasting type', async () => {
    const user = userEvent.setup();
    renderStep();

    await user.click(screen.getByRole('button', { name: /single breasted/i }));
    await user.click(screen.getByRole('button', { name: /double breasted/i }));

    expect(useSuitStore.getState().config.style).toEqual({ breasting: 'double', buttons: 6 });
  });

  it('marks style step as complete in store after selection', async () => {
    const user = userEvent.setup();
    renderStep();

    await user.click(screen.getByRole('button', { name: /single breasted/i }));

    expect(useSuitStore.getState().isStepComplete(1)).toBe(true);
  });
});
