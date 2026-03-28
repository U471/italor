import { useState } from 'react';
import useSuitStore from '../../store/suitStore';
import {
  JACKET_FIELDS,
  TROUSER_FIELDS,
  FIT_PREFERENCES,
} from '../../constants/measurementFields';

/**
 * MeasurementForm — SCRUM-31
 * Step 7 of the suit configurator.
 * Collects 15 body measurements in Jacket (10) + Trousers (5) sections.
 * Supports cm / inches toggle with auto-conversion, fit preference,
 * per-field help tooltips, inline min/max validation, and saves to store.
 */
function MeasurementForm() {
  const { config, setMeasurements } = useSuitStore();

  const [unit, setUnit] = useState('cm');
  const [fitPreference, setFitPreference] = useState('regular');
  const [values, setValues] = useState({});
  const [errors, setErrors] = useState({});
  const [helpField, setHelpField] = useState(null);

  // ── Unit conversion helpers ──────────────────────────────────────────────

  const toCm = (val, currentUnit) =>
    currentUnit === 'inches' ? parseFloat(val) * 2.54 : parseFloat(val);

  const toDisplay = (cmVal, targetUnit) =>
    targetUnit === 'inches' ? (cmVal / 2.54).toFixed(1) : cmVal.toString();

  // ── Unit toggle: convert all existing values ─────────────────────────────

  const handleUnitToggle = (newUnit) => {
    if (newUnit === unit) { return; }
    setValues((prev) => {
      const converted = {};
      Object.entries(prev).forEach(([key, val]) => {
        if (val === '' || val === undefined) { converted[key] = ''; return; }
        const cmVal = toCm(val, unit);
        converted[key] = toDisplay(cmVal, newUnit);
      });
      return converted;
    });
    setUnit(newUnit);
  };

  // ── Validation ───────────────────────────────────────────────────────────

  const validateField = (fieldId, rawVal, allFields) => {
    const field = allFields.find((f) => f.id === fieldId);
    if (!field) { return ''; }
    const num = parseFloat(rawVal);
    if (rawVal === '' || rawVal === undefined || isNaN(num)) { return 'This field is required'; }
    const cmVal = toCm(num, unit);
    const displayMin = unit === 'inches' ? (field.min / 2.54).toFixed(1) : field.min;
    const displayMax = unit === 'inches' ? (field.max / 2.54).toFixed(1) : field.max;
    if (cmVal < field.min || cmVal > field.max) {
      return `Please enter a value between ${displayMin} and ${displayMax} ${unit}`;
    }
    return '';
  };

  const allFields = [...JACKET_FIELDS, ...TROUSER_FIELDS];

  const allValid = allFields.every((f) => {
    const val = values[f.id];
    return (
      val !== '' &&
      val !== undefined &&
      !isNaN(parseFloat(val)) &&
      validateField(f.id, val, allFields) === ''
    );
  });

  // ── Save handler ─────────────────────────────────────────────────────────

  const handleSave = () => {
    const jacketVals = {};
    JACKET_FIELDS.forEach((f) => { jacketVals[f.id] = toCm(parseFloat(values[f.id]), unit); });
    const trouserVals = {};
    TROUSER_FIELDS.forEach((f) => { trouserVals[f.id] = toCm(parseFloat(values[f.id]), unit); });
    setMeasurements({ unit: 'cm', fitPreference, jacket: jacketVals, trousers: trouserVals });
  };

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-8">
      <p className="text-gray-500 text-sm">
        Enter your body measurements below for a perfectly tailored fit.
        All values are stored in cm internally.
      </p>

      {/* ── Unit toggle ──────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-gray-700">Unit:</span>
        <div className="flex rounded-lg border border-gray-300 overflow-hidden">
          {['cm', 'inches'].map((u) => (
            <button
              key={u}
              type="button"
              onClick={() => handleUnitToggle(u)}
              className={`px-4 py-1.5 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 ${
                unit === u
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              {u}
            </button>
          ))}
        </div>
      </div>

      {/* ── Fit preference ───────────────────────────────────────────────── */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Fit Preference</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {FIT_PREFERENCES.map((pref) => {
            const isSelected = fitPreference === pref.id;
            return (
              <button
                key={pref.id}
                type="button"
                onClick={() => setFitPreference(pref.id)}
                aria-pressed={isSelected}
                className={`flex flex-col items-start text-left p-4 rounded-xl border-2 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-indigo-400 ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-800'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <span className="text-sm font-semibold">{pref.label}</span>
                <span className="mt-1 text-xs leading-relaxed">{pref.description}</span>
                <span className={`mt-2 text-xs font-medium ${isSelected ? 'text-indigo-600' : 'text-gray-400'}`}>
                  +{pref.ease} cm ease
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Jacket measurements ──────────────────────────────────────────── */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Jacket Measurements</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {JACKET_FIELDS.map((field) => (
            <MeasurementField
              key={field.id}
              field={field}
              unit={unit}
              value={values[field.id] ?? ''}
              error={errors[field.id]}
              helpOpen={helpField === field.id}
              onHelpToggle={() => setHelpField(helpField === field.id ? null : field.id)}
              onChange={(val) => setValues((prev) => ({ ...prev, [field.id]: val }))}
              onBlur={(val) => {
                const err = validateField(field.id, val, allFields);
                setErrors((prev) => ({ ...prev, [field.id]: err }));
              }}
            />
          ))}
        </div>
      </div>

      {/* ── Trouser measurements ─────────────────────────────────────────── */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Trouser Measurements</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {TROUSER_FIELDS.map((field) => (
            <MeasurementField
              key={field.id}
              field={field}
              unit={unit}
              value={values[field.id] ?? ''}
              error={errors[field.id]}
              helpOpen={helpField === field.id}
              onHelpToggle={() => setHelpField(helpField === field.id ? null : field.id)}
              onChange={(val) => setValues((prev) => ({ ...prev, [field.id]: val }))}
              onBlur={(val) => {
                const err = validateField(field.id, val, allFields);
                setErrors((prev) => ({ ...prev, [field.id]: err }));
              }}
            />
          ))}
        </div>
      </div>

      {/* ── Saved confirmation banner ─────────────────────────────────────── */}
      {config.measurements && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-800">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          Measurements saved successfully.
        </div>
      )}

      {/* ── Action buttons ────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={!allValid}
          className="px-6 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          Save Measurements
        </button>

        {allValid && (
          <button
            type="button"
            className="px-6 py-2.5 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Add to Cart
          </button>
        )}
      </div>
    </div>
  );
}

// ── MeasurementField sub-component ────────────────────────────────────────────

function MeasurementField({ field, unit, value, error, helpOpen, onHelpToggle, onChange, onBlur }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5">
        <label htmlFor={field.id} className="text-sm font-medium text-gray-700">
          {field.label}
        </label>
        <button
          type="button"
          onClick={onHelpToggle}
          className="w-4 h-4 rounded-full bg-gray-200 text-gray-500 text-xs flex items-center justify-center hover:bg-gray-300 focus:outline-none focus:ring-1 focus:ring-indigo-400"
          aria-label={`Help for ${field.label}`}
        >
          ?
        </button>
      </div>

      {helpOpen && (
        <p className="text-xs text-indigo-700 bg-indigo-50 rounded-lg px-3 py-2">{field.hint}</p>
      )}

      <div className="flex items-center gap-2">
        <input
          id={field.id}
          type="number"
          min={0}
          step={unit === 'inches' ? 0.1 : 1}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={(e) => onBlur(e.target.value)}
          placeholder={`e.g. ${unit === 'inches' ? (field.min / 2.54 * 1.2).toFixed(1) : Math.round(field.min * 1.2)}`}
          className={`flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
            error ? 'border-red-400 bg-red-50' : 'border-gray-300'
          }`}
        />
        <span className="text-xs text-gray-400 w-10">{unit}</span>
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

export default MeasurementForm;
