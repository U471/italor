import { useEffect, useState } from 'react';
import useSuitStore from '../../store/suitStore';
import useAuthStore from '../../store/authStore';
import {
  JACKET_FIELDS,
  TROUSER_FIELDS,
  FIT_PREFERENCES,
} from '../../constants/measurementFields';
import { STANDARD_SIZES } from '../../constants/standardSizes';
import SizeChartModal from '../SizeChartModal/SizeChartModal';

/**
 * MeasurementForm — SCRUM-31 / SCRUM-32
 * Step 7 of the suit configurator.
 * Collects 15 body measurements in Jacket (10) + Trousers (5) sections.
 * Supports cm / inches toggle with auto-conversion, fit preference,
 * per-field help tooltips, inline min/max validation, and saves to store.
 * SCRUM-32: "Use Saved Profile" section + "Save as Profile" button.
 */
function MeasurementForm() {
  const { config, setMeasurements } = useSuitStore();
  const accessToken = useAuthStore((s) => s.accessToken);
  const isAuthenticated = Boolean(accessToken);

  const [unit, setUnit] = useState('cm');
  const [fitPreference, setFitPreference] = useState('regular');
  const [values, setValues] = useState({});
  const [errors, setErrors] = useState({});
  const [helpField, setHelpField] = useState(null);
  const [showSizeChart, setShowSizeChart] = useState(false);
  const [appliedSize, setAppliedSize] = useState(null);

  // Profile state
  const [profiles, setProfiles] = useState([]);
  const [profileName, setProfileName] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // ── Load profiles on mount / auth change ────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated) return;
    getProfiles()
      .then((res) => setProfiles(res.data.data.profiles))
      .catch(() => setProfiles([]));
  }, [isAuthenticated]);

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

  // ── Standard size apply handler ──────────────────────────────────────────

  const handleApplyStandardSize = (sizeKey) => {
    const sizeData = STANDARD_SIZES[sizeKey];
    const newValues = {};
    [...JACKET_FIELDS, ...TROUSER_FIELDS].forEach((f) => {
      newValues[f.id] = String(sizeData[f.id]);
    });
    setValues(newValues);
    setErrors({});
    setUnit('cm');
    setAppliedSize(sizeKey);
    setShowSizeChart(false);
  };

  // ── Save handler ─────────────────────────────────────────────────────────

  const handleSave = () => {
    const jacketVals = {};
    JACKET_FIELDS.forEach((f) => { jacketVals[f.id] = toCm(parseFloat(values[f.id]), unit); });
    const trouserVals = {};
    TROUSER_FIELDS.forEach((f) => { trouserVals[f.id] = toCm(parseFloat(values[f.id]), unit); });
    const measurementType = appliedSize ? 'standard' : 'custom';
    setMeasurements({ unit: 'cm', fitPreference, jacket: jacketVals, trousers: trouserVals, measurementType });
  };

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-8">
      {showSizeChart && (
        <SizeChartModal
          onApply={handleApplyStandardSize}
          onClose={() => setShowSizeChart(false)}
        />
      )}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <p className="text-gray-500 text-sm">
          Enter your body measurements below for a perfectly tailored fit.
          All values are stored in cm internally.
        </p>
        <button
          type="button"
          onClick={() => setShowSizeChart(true)}
          className="flex-shrink-0 px-4 py-2 rounded-lg border border-indigo-300 bg-indigo-50 text-indigo-700 text-sm font-medium hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
        >
          Use Standard Size
        </button>
      </div>

      {/* Applied standard size notice */}
      {appliedSize && (
        <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-800">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Standard {appliedSize} applied — for best fit, provide custom measurements next time.
        </div>
      )}

      {/* ── Use Saved Profile section ─────────────────────────────────────── */}
      {isAuthenticated && profiles.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Use Saved Profile</h3>
          <div className="flex flex-wrap gap-3">
            {profiles.map((profile) => (
              <div
                key={profile._id}
                className="flex items-center gap-2 border border-gray-200 rounded-xl px-4 py-2.5 bg-white"
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-medium text-gray-800">{profile.name}</span>
                    {profile.isDefault && (
                      <span className="text-xs bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-full font-medium">
                        Default
                      </span>
                    )}
                  </div>
                  {profile.measurements?.fitPreference && (
                    <span className="text-xs text-gray-400 capitalize">
                      {profile.measurements.fitPreference} fit
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => applyProfile(profile)}
                  className="ml-2 text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  Use This
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

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

      {/* ── Profile save success toast ────────────────────────────────────── */}
      {saveSuccess && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-800">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          Profile saved successfully.
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

        {/* ── Save as Profile (only when logged in + all valid) ───────────── */}
        {isAuthenticated && allValid && (
          <button
            type="button"
            onClick={() => setShowSaveForm((prev) => !prev)}
            className="px-6 py-2.5 rounded-lg border border-indigo-300 text-indigo-700 text-sm font-medium hover:bg-indigo-50 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            Save as Profile
          </button>
        )}
      </div>

      {/* ── Save as Profile inline form ───────────────────────────────────── */}
      {isAuthenticated && allValid && showSaveForm && (
        <div className="flex items-center gap-3 p-4 bg-gray-50 border border-gray-200 rounded-xl">
          <input
            type="text"
            value={profileName}
            onChange={(e) => setProfileName(e.target.value)}
            placeholder="e.g. My Regular Fit"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="button"
            onClick={handleSaveProfile}
            disabled={savingProfile || !profileName.trim()}
            className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {savingProfile ? 'Saving…' : 'Confirm'}
          </button>
          <button
            type="button"
            onClick={() => { setShowSaveForm(false); setProfileName(''); }}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Cancel
          </button>
        </div>
      )}
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
