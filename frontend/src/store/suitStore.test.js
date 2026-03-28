import useSuitStore, { BUILDER_STEPS } from './suitStore';

beforeEach(() => {
  useSuitStore.getState().reset();
});

describe('suitStore', () => {
  it('BUILDER_STEPS has 8 entries', () => {
    expect(BUILDER_STEPS).toHaveLength(8);
  });

  it('initialises with currentStep 0 and null config', () => {
    const { currentStep, config } = useSuitStore.getState();
    expect(currentStep).toBe(0);
    expect(config.fabric).toBeNull();
    expect(config.measurements).toBeNull();
  });

  it('goNext increments currentStep', () => {
    useSuitStore.getState().goNext();
    expect(useSuitStore.getState().currentStep).toBe(1);
  });

  it('goNext does not exceed last step', () => {
    const last = BUILDER_STEPS.length - 1;
    useSuitStore.setState({ currentStep: last });
    useSuitStore.getState().goNext();
    expect(useSuitStore.getState().currentStep).toBe(last);
  });

  it('goPrev decrements currentStep', () => {
    useSuitStore.setState({ currentStep: 3 });
    useSuitStore.getState().goPrev();
    expect(useSuitStore.getState().currentStep).toBe(2);
  });

  it('goPrev does not go below 0', () => {
    useSuitStore.getState().goPrev();
    expect(useSuitStore.getState().currentStep).toBe(0);
  });

  it('goToStep sets step within bounds', () => {
    useSuitStore.getState().goToStep(5);
    expect(useSuitStore.getState().currentStep).toBe(5);
  });

  it('setFabric updates config.fabric', () => {
    const fabric = { _id: 'f1', name: 'Wool' };
    useSuitStore.getState().setFabric(fabric);
    expect(useSuitStore.getState().config.fabric).toEqual(fabric);
  });

  it('setStyle updates config.style', () => {
    const style = { breasting: 'single', buttons: 2 };
    useSuitStore.getState().setStyle(style);
    expect(useSuitStore.getState().config.style).toEqual(style);
  });

  it('setLapel updates config.lapel', () => {
    useSuitStore.getState().setLapel({ style: 'notch', width: 'regular' });
    expect(useSuitStore.getState().config.lapel).toMatchObject({ style: 'notch' });
  });

  it('setLining updates config.lining', () => {
    useSuitStore.getState().setLining({ color: 'navy' });
    expect(useSuitStore.getState().config.lining).toMatchObject({ color: 'navy' });
  });

  it('setDetails updates config.details', () => {
    useSuitStore.getState().setDetails({ pocketStyle: 'flap' });
    expect(useSuitStore.getState().config.details).toMatchObject({ pocketStyle: 'flap' });
  });

  it('setMonogram updates config.monogram', () => {
    useSuitStore.getState().setMonogram({ text: 'AB', enabled: true });
    expect(useSuitStore.getState().config.monogram).toMatchObject({ text: 'AB' });
  });

  it('setMeasurements updates config.measurements', () => {
    const m = { unit: 'cm', fitPreference: 'slim', jacket: {}, trousers: {} };
    useSuitStore.getState().setMeasurements(m);
    expect(useSuitStore.getState().config.measurements).toEqual(m);
  });

  it('setDesignId updates designId', () => {
    useSuitStore.getState().setDesignId('d123');
    expect(useSuitStore.getState().designId).toBe('d123');
  });

  it('loadConfig restores config and resets step', () => {
    useSuitStore.setState({ currentStep: 4 });
    useSuitStore.getState().loadConfig({ fabric: { _id: 'f1' } });
    expect(useSuitStore.getState().currentStep).toBe(0);
    expect(useSuitStore.getState().config.fabric).toMatchObject({ _id: 'f1' });
  });

  it('isStepComplete returns false for null config item', () => {
    expect(useSuitStore.getState().isStepComplete(0)).toBe(false);
  });

  it('isStepComplete returns true after setting fabric', () => {
    useSuitStore.getState().setFabric({ _id: 'f1' });
    expect(useSuitStore.getState().isStepComplete(0)).toBe(true);
  });

  it('isStepComplete returns false for review step', () => {
    const reviewIdx = BUILDER_STEPS.findIndex((s) => s.id === 'review');
    expect(useSuitStore.getState().isStepComplete(reviewIdx)).toBe(false);
  });

  it('reset clears all config and step', () => {
    useSuitStore.getState().setFabric({ _id: 'f1' });
    useSuitStore.getState().goToStep(3);
    useSuitStore.getState().reset();
    expect(useSuitStore.getState().currentStep).toBe(0);
    expect(useSuitStore.getState().config.fabric).toBeNull();
  });
});
