import { create } from 'zustand';

export const BUILDER_STEPS = [
  { id: 'fabric', label: 'Fabric' },
  { id: 'style', label: 'Style' },
  { id: 'lapel', label: 'Lapel' },
  { id: 'lining', label: 'Lining' },
  { id: 'details', label: 'Details' },
  { id: 'monogram', label: 'Monogram' },
  { id: 'review', label: 'Review' },
];

const INITIAL_CONFIG = {
  fabric: null,       // { _id, name, material, color, price, thumbnailUrl }
  style: null,        // { breasting, buttons }
  lapel: null,        // { style, width }
  lining: null,       // { color, pattern }
  details: null,      // { pocketStyle, ventStyle, sleeveButtons }
  monogram: null,     // { text, position, font }
};

const useSuitStore = create((set, get) => ({
  currentStep: 0,
  config: { ...INITIAL_CONFIG },
  designId: null,

  // ── Step navigation ──────────────────────────────────────────────────────
  goNext: () =>
    set((state) => ({
      currentStep: Math.min(state.currentStep + 1, BUILDER_STEPS.length - 1),
    })),

  goPrev: () =>
    set((state) => ({
      currentStep: Math.max(state.currentStep - 1, 0),
    })),

  goToStep: (index) =>
    set(() => ({
      currentStep: Math.max(0, Math.min(index, BUILDER_STEPS.length - 1)),
    })),

  // ── Config setters ───────────────────────────────────────────────────────
  setFabric: (fabric) =>
    set((state) => ({ config: { ...state.config, fabric } })),

  setStyle: (style) =>
    set((state) => ({ config: { ...state.config, style } })),

  setLapel: (lapel) =>
    set((state) => ({ config: { ...state.config, lapel } })),

  setLining: (lining) =>
    set((state) => ({ config: { ...state.config, lining } })),

  setDetails: (details) =>
    set((state) => ({ config: { ...state.config, details } })),

  setMonogram: (monogram) =>
    set((state) => ({ config: { ...state.config, monogram } })),

  setDesignId: (designId) => set({ designId }),

  // ── Helpers ──────────────────────────────────────────────────────────────
  isStepComplete: (stepIndex) => {
    const { config } = get();
    const step = BUILDER_STEPS[stepIndex];
    if (!step) { return false; }
    if (step.id === 'review') { return false; }
    return config[step.id] !== null;
  },

  reset: () =>
    set({ currentStep: 0, config: { ...INITIAL_CONFIG }, designId: null }),
}));

export default useSuitStore;
