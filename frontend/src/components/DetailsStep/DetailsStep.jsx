import { useState } from 'react';
import useSuitStore from '../../store/suitStore';
import { BUTTON_MATERIALS, POCKET_STYLES, VENT_STYLES } from '../../constants/detailOptions';

/**
 * DetailsStep — SCRUM-27
 * Lets the user configure fine structural details:
 *   1. Button material: Horn, Plastic, Metal, Fabric-covered
 *   2. Working Buttonholes (Surgeon's Cuffs) toggle
 *   3. Pocket style: Flap, Jetted, Patch
 *   4. Vent style: Single, Double, No Vent (with front/back preview toggle)
 * Reads and writes directly from/to suitStore via setDetails.
 */
function DetailsStep() {
  const { config, setDetails } = useSuitStore();
  const details = config.details;

  const [showCuffsTooltip, setShowCuffsTooltip] = useState(false);
  const [previewView, setPreviewView] = useState('front'); // 'front' | 'back'

  function handleButtonMaterial(materialId) {
    setDetails({ ...details, buttonMaterial: materialId });
  }

  function handleWorkingCuffs(value) {
    setDetails({ ...details, workingButtonholes: value });
  }

  function handlePocketStyle(pocketId) {
    setDetails({ ...details, pocketStyle: pocketId });
  }

  function handleVentStyle(ventId) {
    setDetails({ ...details, ventStyle: ventId });
    if (ventId !== 'none') { setPreviewView('back'); }
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="text-gray-500 text-sm">
          Customize the fine structural details of your suit.
        </p>
      </div>

      {/* ── BUTTONS SECTION ──────────────────────────────────────────────────── */}
      <section>
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
          Button Material
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {BUTTON_MATERIALS.map((btn) => {
            const isSelected = details?.buttonMaterial === btn.id;
            return (
              <button
                key={btn.id}
                type="button"
                aria-pressed={isSelected}
                onClick={() => handleButtonMaterial(btn.id)}
                className={`p-3 rounded-xl border-2 text-left transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-brand-400 ${
                  isSelected
                    ? 'ring-2 ring-indigo-600 bg-indigo-50 border-indigo-600'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <div className="w-full h-16 bg-gray-100 rounded-lg mb-2 flex items-center justify-center">
                  <ButtonMaterialIcon materialId={btn.id} />
                </div>
                <p className="font-medium text-gray-900 text-sm">{btn.label}</p>
                <p className="text-xs text-gray-400">{btn.subtitle}</p>
              </button>
            );
          })}
        </div>

        {/* Surgeon's Cuffs Toggle */}
        <div className="mt-4 p-4 bg-gray-50 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-800">
              Working Buttonholes (Surgeon&apos;s Cuffs)
            </span>
            <div className="relative">
              <button
                type="button"
                onMouseEnter={() => setShowCuffsTooltip(true)}
                onMouseLeave={() => setShowCuffsTooltip(false)}
                className="w-5 h-5 rounded-full bg-gray-300 text-gray-600 text-xs flex items-center justify-center hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-brand-400 transition-colors"
                aria-label="What are Surgeon's Cuffs?"
              >
                ?
              </button>
              {showCuffsTooltip && (
                <div
                  role="tooltip"
                  className="absolute left-6 top-0 z-10 w-64 bg-gray-900 text-white text-xs rounded-lg p-3 shadow-xl"
                >
                  Working buttonholes are a hallmark of bespoke tailoring. The sleeve buttons can
                  actually be undone — a subtle signal of true craftsmanship.
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            {['yes', 'no'].map((val) => {
              const isActive =
                val === 'yes'
                  ? details?.workingButtonholes === true
                  : details?.workingButtonholes === false;
              return (
                <button
                  key={val}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => handleWorkingCuffs(val === 'yes')}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-brand-400 ${
                    isActive
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white border border-gray-300 text-gray-600 hover:border-gray-400'
                  }`}
                >
                  {val.toUpperCase()}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── POCKETS SECTION ──────────────────────────────────────────────────── */}
      <section>
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
          Pocket Style
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {POCKET_STYLES.map((pocket) => {
            const isSelected = details?.pocketStyle === pocket.id;
            return (
              <button
                key={pocket.id}
                type="button"
                aria-pressed={isSelected}
                onClick={() => handlePocketStyle(pocket.id)}
                className={`p-4 rounded-xl border-2 text-left transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-brand-400 ${
                  isSelected
                    ? 'ring-2 ring-indigo-600 bg-indigo-50 border-indigo-600'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <div className="w-full h-20 bg-gray-100 rounded-lg mb-2 flex items-center justify-center">
                  <PocketStyleIcon pocketId={pocket.id} isSelected={isSelected} />
                </div>
                <p className="font-medium text-gray-900 text-sm">{pocket.label}</p>
                <p className="text-xs text-gray-500 mt-0.5 leading-snug">{pocket.description}</p>
              </button>
            );
          })}
        </div>
      </section>

      {/* ── VENTS SECTION ────────────────────────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
            Vent Style
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Preview:</span>
            <button
              type="button"
              onClick={() => setPreviewView(previewView === 'front' ? 'back' : 'front')}
              className="text-xs bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full font-medium hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-brand-400 transition-colors"
            >
              {previewView === 'front' ? 'Show Back View' : 'Show Front View'}
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {VENT_STYLES.map((vent) => {
            const isSelected = details?.ventStyle === vent.id;
            return (
              <button
                key={vent.id}
                type="button"
                aria-pressed={isSelected}
                onClick={() => handleVentStyle(vent.id)}
                className={`p-4 rounded-xl border-2 text-left transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-brand-400 ${
                  isSelected
                    ? 'ring-2 ring-indigo-600 bg-indigo-50 border-indigo-600'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <div className="w-full h-20 bg-gray-100 rounded-lg mb-2 flex items-center justify-center">
                  <VentStyleIcon ventId={vent.id} view={previewView} isSelected={isSelected} />
                </div>
                <p className="font-medium text-gray-900 text-sm">{vent.label}</p>
                <p className="text-xs text-gray-500 mt-0.5 leading-snug">{vent.description}</p>
              </button>
            );
          })}
        </div>
        {/* Hint label showing current view */}
        <p className="mt-2 text-xs text-gray-400">
          Showing {previewView === 'front' ? 'front' : 'back'} view — vent is visible from the back.
        </p>
      </section>

      {/* No selection hint */}
      {!details?.buttonMaterial && !details?.pocketStyle && !details?.ventStyle && (
        <p className="text-xs text-gray-400">
          Select your preferred options above to continue.
        </p>
      )}
    </div>
  );
}

// ── Helper icon components ─────────────────────────────────────────────────────

function ButtonMaterialIcon({ materialId }) {
  const iconMap = {
    horn: (
      <svg viewBox="0 0 40 40" className="w-8 h-8" fill="none" stroke="#9ca3af" strokeWidth="1.5" aria-hidden="true">
        <circle cx="20" cy="20" r="10" />
        <circle cx="20" cy="20" r="4" fill="#9ca3af" fillOpacity="0.3" />
        {[45, 135, 225, 315].map((angle) => {
          const rad = (angle * Math.PI) / 180;
          const x1 = 20 + 5 * Math.cos(rad);
          const y1 = 20 + 5 * Math.sin(rad);
          const x2 = 20 + 9 * Math.cos(rad);
          const y2 = 20 + 9 * Math.sin(rad);
          return <line key={angle} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#6b7280" strokeWidth="1" />;
        })}
      </svg>
    ),
    plastic: (
      <svg viewBox="0 0 40 40" className="w-8 h-8" fill="none" stroke="#9ca3af" strokeWidth="1.5" aria-hidden="true">
        <circle cx="20" cy="20" r="11" fill="#e5e7eb" />
        <circle cx="20" cy="20" r="11" />
        <circle cx="17" cy="17" r="1.5" fill="#9ca3af" />
        <circle cx="23" cy="17" r="1.5" fill="#9ca3af" />
        <circle cx="17" cy="23" r="1.5" fill="#9ca3af" />
        <circle cx="23" cy="23" r="1.5" fill="#9ca3af" />
      </svg>
    ),
    metal: (
      <svg viewBox="0 0 40 40" className="w-8 h-8" fill="none" aria-hidden="true">
        <circle cx="20" cy="20" r="11" fill="#d1d5db" stroke="#9ca3af" strokeWidth="1.5" />
        <circle cx="20" cy="20" r="8" fill="#e5e7eb" stroke="#9ca3af" strokeWidth="1" />
        <circle cx="20" cy="20" r="3" fill="#9ca3af" />
        <line x1="20" y1="12" x2="20" y2="15" stroke="#9ca3af" strokeWidth="1" />
        <line x1="20" y1="25" x2="20" y2="28" stroke="#9ca3af" strokeWidth="1" />
        <line x1="12" y1="20" x2="15" y2="20" stroke="#9ca3af" strokeWidth="1" />
        <line x1="25" y1="20" x2="28" y2="20" stroke="#9ca3af" strokeWidth="1" />
      </svg>
    ),
    'fabric-covered': (
      <svg viewBox="0 0 40 40" className="w-8 h-8" fill="none" stroke="#9ca3af" strokeWidth="1.5" aria-hidden="true">
        <circle cx="20" cy="20" r="11" />
        {/* Fabric texture lines */}
        <line x1="11" y1="17" x2="29" y2="17" stroke="#9ca3af" strokeWidth="0.8" strokeDasharray="2 2" />
        <line x1="11" y1="20" x2="29" y2="20" stroke="#9ca3af" strokeWidth="0.8" strokeDasharray="2 2" />
        <line x1="11" y1="23" x2="29" y2="23" stroke="#9ca3af" strokeWidth="0.8" strokeDasharray="2 2" />
        <circle cx="20" cy="20" r="3" fill="#9ca3af" fillOpacity="0.5" />
      </svg>
    ),
  };
  return iconMap[materialId] ?? <span className="text-gray-400 text-xs">{materialId}</span>;
}

function PocketStyleIcon({ pocketId, isSelected }) {
  const color = isSelected ? '#6366f1' : '#9ca3af';
  const iconMap = {
    flap: (
      <svg viewBox="0 0 60 40" className="w-14 h-10" fill="none" stroke={color} strokeWidth="1.5" aria-hidden="true">
        {/* Pocket opening */}
        <rect x="10" y="20" width="40" height="16" rx="1" />
        {/* Flap over the opening */}
        <rect x="10" y="14" width="40" height="10" rx="2" fill={isSelected ? '#e0e7ff' : '#f3f4f6'} stroke={color} strokeWidth="1.5" />
        {/* Button on flap */}
        <circle cx="30" cy="19" r="2" fill={color} />
      </svg>
    ),
    jetted: (
      <svg viewBox="0 0 60 40" className="w-14 h-10" fill="none" stroke={color} strokeWidth="1.5" aria-hidden="true">
        {/* Jetted — just a slim horizontal slit with two welts */}
        <line x1="10" y1="20" x2="50" y2="20" strokeWidth="3" />
        <line x1="10" y1="16" x2="50" y2="16" strokeWidth="1" />
        <line x1="10" y1="24" x2="50" y2="24" strokeWidth="1" />
      </svg>
    ),
    patch: (
      <svg viewBox="0 0 60 40" className="w-14 h-10" fill="none" stroke={color} strokeWidth="1.5" aria-hidden="true">
        {/* Patch pocket — visible sewn-on rectangle */}
        <rect x="12" y="8" width="36" height="28" rx="2" fill={isSelected ? '#e0e7ff' : '#f3f4f6'} />
        {/* Top stitching line */}
        <line x1="12" y1="14" x2="48" y2="14" strokeDasharray="2 2" />
      </svg>
    ),
  };
  return iconMap[pocketId] ?? <span className="text-gray-400 text-xs">{pocketId}</span>;
}

function VentStyleIcon({ ventId, view, isSelected }) {
  const color = isSelected ? '#6366f1' : '#9ca3af';
  const fillLight = isSelected ? '#e0e7ff' : '#f3f4f6';

  if (view === 'front') {
    // Front view — jacket silhouette, vent not visible
    return (
      <svg viewBox="0 0 60 80" className="w-10 h-16" fill="none" stroke={color} strokeWidth="1.5" aria-hidden="true">
        <rect x="10" y="5" width="40" height="70" rx="3" fill={fillLight} />
        <path d="M30 5 L30 75" strokeDasharray="3 3" />
        <path d="M30 5 L22 18 L30 24 L38 18 Z" fill={color} fillOpacity="0.3" />
        <rect x="15" y="50" width="13" height="9" rx="1" fill="white" stroke={color} strokeWidth="1" />
        <rect x="32" y="50" width="13" height="9" rx="1" fill="white" stroke={color} strokeWidth="1" />
        <text x="30" y="42" textAnchor="middle" fontSize="5" fill={color} stroke="none">FRONT</text>
      </svg>
    );
  }

  // Back view — show vent differences
  const iconMap = {
    single: (
      <svg viewBox="0 0 60 80" className="w-10 h-16" fill="none" stroke={color} strokeWidth="1.5" aria-hidden="true">
        <rect x="10" y="5" width="40" height="70" rx="3" fill={fillLight} />
        {/* Single central vent */}
        <line x1="30" y1="45" x2="30" y2="75" strokeWidth="2" />
        <text x="30" y="35" textAnchor="middle" fontSize="5" fill={color} stroke="none">BACK</text>
      </svg>
    ),
    double: (
      <svg viewBox="0 0 60 80" className="w-10 h-16" fill="none" stroke={color} strokeWidth="1.5" aria-hidden="true">
        <rect x="10" y="5" width="40" height="70" rx="3" fill={fillLight} />
        {/* Two side vents */}
        <line x1="22" y1="45" x2="22" y2="75" strokeWidth="2" />
        <line x1="38" y1="45" x2="38" y2="75" strokeWidth="2" />
        <text x="30" y="35" textAnchor="middle" fontSize="5" fill={color} stroke="none">BACK</text>
      </svg>
    ),
    none: (
      <svg viewBox="0 0 60 80" className="w-10 h-16" fill="none" stroke={color} strokeWidth="1.5" aria-hidden="true">
        <rect x="10" y="5" width="40" height="70" rx="3" fill={fillLight} />
        {/* No vent — clean flat back */}
        <line x1="30" y1="5" x2="30" y2="75" strokeDasharray="3 3" strokeWidth="1" />
        <text x="30" y="35" textAnchor="middle" fontSize="5" fill={color} stroke="none">BACK</text>
      </svg>
    ),
  };
  return iconMap[ventId] ?? <span className="text-gray-400 text-xs">{ventId}</span>;
}

export default DetailsStep;
