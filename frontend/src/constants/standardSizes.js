/**
 * Standard size chart for SCRUM-33 (US-MEASURE-003).
 * All measurements are in cm.
 * Covers all 15 fields used in MeasurementForm (10 jacket + 5 trouser).
 */

export const STANDARD_SIZE_LABELS = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'];

export const STANDARD_SIZES = {
  XS: {
    label: 'XS',
    chest: 86, waist: 71, hips: 86, shoulders: 41, neck: 35,
    sleeveLength: 59, bicep: 29, wrist: 16, jacketLength: 68, backLength: 40,
    inseam: 74, outseam: 96, thigh: 52, knee: 37, trouserBottom: 32,
  },
  S: {
    label: 'S',
    chest: 91, waist: 76, hips: 91, shoulders: 43, neck: 37,
    sleeveLength: 60, bicep: 31, wrist: 17, jacketLength: 70, backLength: 41,
    inseam: 76, outseam: 98, thigh: 54, knee: 38, trouserBottom: 33,
  },
  M: {
    label: 'M',
    chest: 97, waist: 81, hips: 97, shoulders: 45, neck: 38,
    sleeveLength: 62, bicep: 33, wrist: 17, jacketLength: 72, backLength: 43,
    inseam: 78, outseam: 100, thigh: 57, knee: 40, trouserBottom: 35,
  },
  L: {
    label: 'L',
    chest: 102, waist: 86, hips: 102, shoulders: 47, neck: 40,
    sleeveLength: 63, bicep: 35, wrist: 18, jacketLength: 74, backLength: 44,
    inseam: 79, outseam: 102, thigh: 60, knee: 42, trouserBottom: 37,
  },
  XL: {
    label: 'XL',
    chest: 107, waist: 92, hips: 107, shoulders: 48, neck: 42,
    sleeveLength: 64, bicep: 37, wrist: 19, jacketLength: 75, backLength: 45,
    inseam: 80, outseam: 103, thigh: 62, knee: 43, trouserBottom: 38,
  },
  XXL: {
    label: 'XXL',
    chest: 112, waist: 97, hips: 112, shoulders: 50, neck: 44,
    sleeveLength: 65, bicep: 39, wrist: 19, jacketLength: 77, backLength: 46,
    inseam: 81, outseam: 104, thigh: 65, knee: 45, trouserBottom: 40,
  },
  '3XL': {
    label: '3XL',
    chest: 117, waist: 102, hips: 117, shoulders: 51, neck: 46,
    sleeveLength: 66, bicep: 41, wrist: 20, jacketLength: 78, backLength: 47,
    inseam: 82, outseam: 105, thigh: 68, knee: 46, trouserBottom: 42,
  },
};

// Rows shown in the size chart table, in display order
export const SIZE_CHART_ROWS = [
  { id: 'chest',         label: 'Chest (cm)' },
  { id: 'waist',         label: 'Waist (cm)' },
  { id: 'hips',          label: 'Hips (cm)' },
  { id: 'shoulders',     label: 'Shoulders (cm)' },
  { id: 'neck',          label: 'Neck (cm)' },
  { id: 'sleeveLength',  label: 'Sleeve Length (cm)' },
  { id: 'bicep',         label: 'Bicep (cm)' },
  { id: 'wrist',         label: 'Wrist (cm)' },
  { id: 'jacketLength',  label: 'Jacket Length (cm)' },
  { id: 'backLength',    label: 'Back Length (cm)' },
  { id: 'inseam',        label: 'Inseam (cm)' },
  { id: 'outseam',       label: 'Outseam (cm)' },
  { id: 'thigh',         label: 'Thigh (cm)' },
  { id: 'knee',          label: 'Knee (cm)' },
  { id: 'trouserBottom', label: 'Trouser Bottom (cm)' },
];
