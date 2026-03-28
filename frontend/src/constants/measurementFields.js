export const INCH_TO_CM = 2.54;

export const FIT_PREFERENCES = [
  { id: 'slim', label: 'Slim Fit', ease: 2, description: 'Close to body. Modern, tailored silhouette.' },
  { id: 'regular', label: 'Regular Fit', ease: 4, description: 'Classic comfortable fit. Most versatile.' },
  { id: 'comfort', label: 'Comfort Fit', ease: 6, description: 'Relaxed and roomy. Maximum ease of movement.' },
];

// All ranges in cm
export const JACKET_FIELDS = [
  { id: 'chest', label: 'Chest', min: 60, max: 160, hint: 'Measure around the fullest part of your chest, arms relaxed.' },
  { id: 'waist', label: 'Waist', min: 55, max: 150, hint: 'Measure around your natural waist (narrowest point).' },
  { id: 'hips', label: 'Hips', min: 70, max: 165, hint: 'Measure around the fullest part of your hips.' },
  { id: 'shoulders', label: 'Shoulders', min: 35, max: 60, hint: 'Measure from shoulder seam to shoulder seam across the back.' },
  { id: 'neck', label: 'Neck', min: 28, max: 55, hint: 'Measure around the base of your neck.' },
  { id: 'sleeveLength', label: 'Sleeve Length', min: 55, max: 75, hint: 'Measure from the shoulder point to the wrist bone.' },
  { id: 'bicep', label: 'Bicep', min: 25, max: 55, hint: 'Measure around the fullest part of your upper arm, relaxed.' },
  { id: 'wrist', label: 'Wrist', min: 14, max: 25, hint: 'Measure around your wrist just below the wrist bone.' },
  { id: 'jacketLength', label: 'Jacket Length', min: 60, max: 90, hint: 'Measure from the base of your neck to where you want the jacket hem.' },
  { id: 'backLength', label: 'Back Length', min: 35, max: 55, hint: 'Measure from the top of the spine (nape) to the natural waist.' },
];

export const TROUSER_FIELDS = [
  { id: 'inseam', label: 'Inseam', min: 65, max: 95, hint: 'Measure from the crotch to the floor along the inside leg.' },
  { id: 'outseam', label: 'Outseam', min: 90, max: 120, hint: 'Measure from the waist to the floor along the outside of the leg.' },
  { id: 'thigh', label: 'Thigh', min: 45, max: 80, hint: 'Measure around the fullest part of your thigh.' },
  { id: 'knee', label: 'Knee', min: 30, max: 55, hint: 'Measure around the knee, slightly bent.' },
  { id: 'trouserBottom', label: 'Trouser Bottom', min: 28, max: 50, hint: 'Measure the desired trouser opening circumference.' },
];
