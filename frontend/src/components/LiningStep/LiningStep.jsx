import { useState } from 'react';
import useSuitStore from '../../store/suitStore';
import { LINING_TYPES, LINING_COLORS, LINING_PATTERNS } from '../../constants/liningOptions';

/**
 * LiningStep — SCRUM-26
 * Lets the user choose:
 *   1. Lining type: Full Lining or Half Lining
 *   2. Color or Pattern swatch (31 colors incl. 3 premium CUPRA + 11 patterns)
 * Reads and writes directly from/to suitStore via setLining.
 */
function LiningStep() {
  const { config, setLining } = useSuitStore();
  const current = config.lining;

  const [activeTab, setActiveTab] = useState('colors');
  const [hoveredSwatch, setHoveredSwatch] = useState(null);

  function handleTypeSelect(typeId) {
    setLining({
      type: typeId,
      color: current?.color ?? null,
      pattern: current?.pattern ?? null,
      material: current?.material ?? null,
    });
  }

  function handleColorSelect(color) {
    setLining({
      type: current?.type ?? null,
      color: color.id,
      pattern: null,
      material: color.isCupra ? 'cupra' : 'standard',
    });
  }

  function handlePatternSelect(pattern) {
    setLining({
      type: current?.type ?? null,
      color: null,
      pattern: pattern.id,
      material: current?.material ?? 'standard',
    });
  }

  const selectedColor = LINING_COLORS.find((c) => c.id === current?.color) ?? null;
  const selectedPattern = LINING_PATTERNS.find((p) => p.id === current?.pattern) ?? null;
  const isCupraSelected = selectedColor?.isCupra === true;

  // The item currently shown in the preview panel (hovered takes priority over selected)
  const previewColor = hoveredSwatch?.kind === 'color'
    ? LINING_COLORS.find((c) => c.id === hoveredSwatch.id)
    : selectedColor;
  const previewPattern = hoveredSwatch?.kind === 'pattern'
    ? LINING_PATTERNS.find((p) => p.id === hoveredSwatch.id)
    : (!hoveredSwatch ? selectedPattern : null);

  return (
    <div>
      <p className="text-gray-500 text-sm mb-6">
        The lining is your suit&apos;s hidden signature. Choose the coverage, color, or pattern that speaks to you.
      </p>

      {/* ── Lining type cards ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        {LINING_TYPES.map((type) => {
          const isSelected = current?.type === type.id;
          return (
            <button
              key={type.id}
              type="button"
              aria-pressed={isSelected}
              onClick={() => handleTypeSelect(type.id)}
              className={`flex flex-col items-center text-center p-5 rounded-xl border-2 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-brand-400 ${
                isSelected
                  ? 'border-brand-600 bg-brand-50 text-brand-800'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              {/* Inline SVG diagram — full vs half lining */}
              <span className={`mb-3 ${isSelected ? 'text-brand-600' : 'text-gray-400'}`}>
                {type.id === 'full' ? <FullLiningDiagram /> : <HalfLiningDiagram />}
              </span>
              <span className="text-sm font-semibold">{type.label}</span>
              <span className="mt-1 text-xs leading-relaxed">{type.description}</span>
            </button>
          );
        })}
      </div>

      {/* ── Swatch section + preview panel ───────────────────────────────── */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left: tabs + swatches */}
        <div className="flex-1">
          {/* Tab switcher */}
          <div className="flex gap-1 mb-4 border-b border-gray-200">
            {['colors', 'patterns'].map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-sm font-medium capitalize border-b-2 transition-colors duration-150 focus:outline-none ${
                  activeTab === tab
                    ? 'border-brand-600 text-brand-700'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Color swatches */}
          {activeTab === 'colors' && (
            <div className="grid grid-cols-6 sm:grid-cols-8 gap-2">
              {LINING_COLORS.map((color) => {
                const isSelected = current?.color === color.id;
                return (
                  <div key={color.id} className="relative group">
                    <button
                      type="button"
                      aria-label={color.name}
                      aria-pressed={isSelected}
                      onClick={() => handleColorSelect(color)}
                      onMouseEnter={() => setHoveredSwatch({ kind: 'color', id: color.id })}
                      onMouseLeave={() => setHoveredSwatch(null)}
                      className={`w-full aspect-square rounded-lg border-2 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:ring-offset-1 ${
                        isSelected
                          ? 'border-brand-600 scale-110 shadow-md'
                          : 'border-gray-200 hover:border-gray-400 hover:scale-105'
                      }`}
                      style={{ backgroundColor: color.hexCode }}
                    />
                    {/* CUPRA Eco Luxury badge */}
                    {color.isCupra && (
                      <span className="absolute -top-1 -right-1 bg-emerald-600 text-white text-[9px] font-bold leading-none px-1 py-0.5 rounded-full pointer-events-none">
                        ECO
                      </span>
                    )}
                    {/* Tooltip on hover */}
                    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 whitespace-nowrap bg-gray-800 text-white text-[10px] px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                      {color.name}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pattern swatches */}
          {activeTab === 'patterns' && (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {LINING_PATTERNS.map((pattern) => {
                const isSelected = current?.pattern === pattern.id;
                return (
                  <div key={pattern.id} className="relative group">
                    <button
                      type="button"
                      aria-label={pattern.name}
                      aria-pressed={isSelected}
                      onClick={() => handlePatternSelect(pattern)}
                      onMouseEnter={() => setHoveredSwatch({ kind: 'pattern', id: pattern.id })}
                      onMouseLeave={() => setHoveredSwatch(null)}
                      className={`w-full aspect-square rounded-xl border-2 bg-gray-100 overflow-hidden flex flex-col items-center justify-center transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:ring-offset-1 ${
                        isSelected
                          ? 'border-brand-600 scale-105 shadow-md'
                          : 'border-gray-200 hover:border-gray-400 hover:scale-102'
                      }`}
                    >
                      <PatternPreviewIcon patternId={pattern.id} />
                    </button>
                    <p className={`mt-1 text-center text-[11px] leading-tight truncate ${isSelected ? 'text-brand-700 font-semibold' : 'text-gray-500'}`}>
                      {pattern.name}
                    </p>
                    {/* Tooltip with description */}
                    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 w-36 text-center bg-gray-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 leading-snug">
                      {pattern.description}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Selection summary */}
          {!current?.color && !current?.pattern && (
            <p className="text-xs text-gray-400 mt-4">Select a color or pattern above to continue.</p>
          )}
        </div>

        {/* Right: preview panel */}
        <div className="lg:w-52 flex-shrink-0">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Interior Preview</h3>
          <div className="w-full aspect-[3/4] rounded-xl border-2 border-gray-200 overflow-hidden relative flex items-center justify-center bg-gray-50">
            {/* Jacket interior SVG silhouette with dynamic lining color */}
            <JacketInteriorSVG
              hexCode={previewColor?.hexCode ?? null}
              patternId={previewPattern?.id ?? null}
            />
            {!previewColor && !previewPattern && (
              <p className="absolute text-xs text-gray-400 text-center px-3">
                Hover a swatch to preview
              </p>
            )}
          </div>

          {/* Selected item label */}
          {(previewColor || previewPattern) && (
            <p className="mt-2 text-xs text-center text-gray-600 font-medium">
              {previewColor ? previewColor.name : previewPattern?.name}
            </p>
          )}
        </div>
      </div>

      {/* ── CUPRA info banner ─────────────────────────────────────────────── */}
      {isCupraSelected && (
        <div className="mt-6 flex items-start gap-3 bg-emerald-50 border border-emerald-200 rounded-xl p-4">
          <span className="flex-shrink-0 mt-0.5 text-emerald-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </span>
          <div>
            <p className="text-sm font-semibold text-emerald-800">
              Luxury Upgrade &mdash; Free
              <span className="ml-2 inline-block bg-emerald-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none align-middle">
                Eco Luxury
              </span>
            </p>
            <p className="text-xs text-emerald-700 mt-0.5">
              CUPRA is a premium regenerated cellulose fabric that is silky smooth, highly breathable, and sustainably produced. An eco-conscious choice with zero compromise on quality.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Helper components ──────────────────────────────────────────────────────────

/** SVG diagram for Full Lining */
function FullLiningDiagram() {
  return (
    <svg viewBox="0 0 80 100" className="w-14 h-18" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="12" y="5" width="56" height="90" rx="3" />
      <path d="M40 5 L40 95" strokeDasharray="3 3" />
      {/* Full interior fill */}
      <rect x="14" y="7" width="52" height="86" rx="2" fill="currentColor" fillOpacity="0.12" />
      {/* Collar */}
      <path d="M40 5 L32 22 L40 28 L48 22 Z" fill="currentColor" fillOpacity="0.3" />
    </svg>
  );
}

/** SVG diagram for Half Lining */
function HalfLiningDiagram() {
  return (
    <svg viewBox="0 0 80 100" className="w-14 h-18" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="12" y="5" width="56" height="90" rx="3" />
      <path d="M40 5 L40 95" strokeDasharray="3 3" />
      {/* Back half fill only */}
      <rect x="14" y="50" width="52" height="43" rx="2" fill="currentColor" fillOpacity="0.12" />
      {/* Sleeves suggestion */}
      <rect x="14" y="7" width="10" height="40" rx="2" fill="currentColor" fillOpacity="0.12" />
      <rect x="56" y="7" width="10" height="40" rx="2" fill="currentColor" fillOpacity="0.12" />
      {/* Collar */}
      <path d="M40 5 L32 22 L40 28 L48 22 Z" fill="currentColor" fillOpacity="0.3" />
    </svg>
  );
}

/** Jacket interior silhouette SVG for the preview panel */
function JacketInteriorSVG({ hexCode, patternId }) {
  const fillColor = hexCode ?? 'transparent';
  return (
    <svg viewBox="0 0 120 160" className="w-full h-full" aria-hidden="true">
      {/* Pattern defs */}
      <defs>
        {patternId === 'stripes' && (
          <pattern id="lining-stripes" patternUnits="userSpaceOnUse" width="6" height="6">
            <rect width="6" height="6" fill="#e5e7eb" />
            <line x1="0" y1="0" x2="0" y2="6" stroke="#9ca3af" strokeWidth="2" />
          </pattern>
        )}
        {patternId === 'polka-dots' && (
          <pattern id="lining-polka" patternUnits="userSpaceOnUse" width="10" height="10">
            <rect width="10" height="10" fill="#e5e7eb" />
            <circle cx="5" cy="5" r="2" fill="#9ca3af" />
          </pattern>
        )}
        {patternId === 'geometric' && (
          <pattern id="lining-geo" patternUnits="userSpaceOnUse" width="12" height="12">
            <rect width="12" height="12" fill="#e5e7eb" />
            <rect x="2" y="2" width="8" height="8" fill="none" stroke="#9ca3af" strokeWidth="1.5" />
          </pattern>
        )}
        {patternId === 'houndstooth' && (
          <pattern id="lining-hound" patternUnits="userSpaceOnUse" width="8" height="8">
            <rect width="8" height="8" fill="#e5e7eb" />
            <polygon points="0,0 4,0 4,4" fill="#9ca3af" />
            <polygon points="4,4 8,4 8,8" fill="#9ca3af" />
          </pattern>
        )}
        {patternId === 'plaid' && (
          <pattern id="lining-plaid" patternUnits="userSpaceOnUse" width="10" height="10">
            <rect width="10" height="10" fill="#e5e7eb" />
            <line x1="0" y1="5" x2="10" y2="5" stroke="#9ca3af" strokeWidth="1.5" />
            <line x1="5" y1="0" x2="5" y2="10" stroke="#9ca3af" strokeWidth="1.5" />
          </pattern>
        )}
      </defs>

      {/* Jacket body interior */}
      <path
        d="M20 10 Q20 5 30 5 L90 5 Q100 5 100 10 L100 150 Q100 155 95 155 L25 155 Q20 155 20 150 Z"
        fill={patternId && getPatternFill(patternId) ? `url(#${getPatternFill(patternId)})` : fillColor}
        stroke="#d1d5db"
        strokeWidth="1"
        fillOpacity={hexCode ? 1 : 0}
      />
      {/* Lapel cutouts */}
      <path d="M60 5 L45 30 L60 40 L75 30 Z" fill="white" stroke="#d1d5db" strokeWidth="1" />
      {/* Pocket */}
      <rect x="35" y="100" width="22" height="12" rx="2" fill="white" stroke="#d1d5db" strokeWidth="1" />
      <rect x="63" y="100" width="22" height="12" rx="2" fill="white" stroke="#d1d5db" strokeWidth="1" />
      {/* Seam line */}
      <line x1="60" y1="40" x2="60" y2="155" stroke="#d1d5db" strokeWidth="1" strokeDasharray="3 2" />
    </svg>
  );
}

function getPatternFill(patternId) {
  const map = {
    stripes: 'lining-stripes',
    'polka-dots': 'lining-polka',
    geometric: 'lining-geo',
    houndstooth: 'lining-hound',
    plaid: 'lining-plaid',
  };
  return map[patternId] ?? null;
}

/** Small inline icon representing each pattern in the swatch grid */
function PatternPreviewIcon({ patternId }) {
  const iconMap = {
    paisley: (
      <svg viewBox="0 0 40 40" className="w-8 h-8" fill="none" aria-hidden="true">
        <ellipse cx="20" cy="20" rx="8" ry="14" fill="#9ca3af" />
        <ellipse cx="26" cy="14" rx="4" ry="6" fill="#6b7280" transform="rotate(30 26 14)" />
      </svg>
    ),
    stripes: (
      <svg viewBox="0 0 40 40" className="w-8 h-8" aria-hidden="true">
        {[4, 10, 16, 22, 28, 34].map((x) => (
          <line key={x} x1={x} y1="0" x2={x} y2="40" stroke="#9ca3af" strokeWidth="2" />
        ))}
      </svg>
    ),
    'polka-dots': (
      <svg viewBox="0 0 40 40" className="w-8 h-8" aria-hidden="true">
        {[10, 30].map((cy) =>
          [10, 30].map((cx) => (
            <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="4" fill="#9ca3af" />
          ))
        )}
      </svg>
    ),
    floral: (
      <svg viewBox="0 0 40 40" className="w-8 h-8" fill="#9ca3af" aria-hidden="true">
        <circle cx="20" cy="20" r="5" />
        {[0, 60, 120, 180, 240, 300].map((angle) => {
          const rad = (angle * Math.PI) / 180;
          return (
            <ellipse
              key={angle}
              cx={20 + 9 * Math.cos(rad)}
              cy={20 + 9 * Math.sin(rad)}
              rx="4"
              ry="2.5"
              transform={`rotate(${angle} ${20 + 9 * Math.cos(rad)} ${20 + 9 * Math.sin(rad)})`}
            />
          );
        })}
      </svg>
    ),
    geometric: (
      <svg viewBox="0 0 40 40" className="w-8 h-8" fill="none" stroke="#9ca3af" strokeWidth="2" aria-hidden="true">
        <rect x="5" y="5" width="14" height="14" />
        <rect x="21" y="21" width="14" height="14" />
        <polygon points="21,5 35,5 28,19" fill="#9ca3af" stroke="none" />
        <polygon points="5,21 19,21 12,35" fill="#9ca3af" stroke="none" />
      </svg>
    ),
    houndstooth: (
      <svg viewBox="0 0 40 40" className="w-8 h-8" fill="#9ca3af" aria-hidden="true">
        <polygon points="0,0 20,0 20,20" />
        <polygon points="20,20 40,20 40,40" />
        <polygon points="0,20 10,20 0,30" fill="#6b7280" />
        <polygon points="30,0 40,0 40,10" fill="#6b7280" />
      </svg>
    ),
    herringbone: (
      <svg viewBox="0 0 40 40" className="w-8 h-8" fill="none" stroke="#9ca3af" strokeWidth="2" aria-hidden="true">
        <polyline points="5,35 15,20 5,5" />
        <polyline points="15,35 25,20 15,5" />
        <polyline points="25,35 35,20 25,5" />
      </svg>
    ),
    plaid: (
      <svg viewBox="0 0 40 40" className="w-8 h-8" aria-hidden="true">
        {[8, 20, 32].map((v) => (
          <g key={v}>
            <line x1={v} y1="0" x2={v} y2="40" stroke="#9ca3af" strokeWidth="2" />
            <line x1="0" y1={v} x2="40" y2={v} stroke="#9ca3af" strokeWidth="2" />
          </g>
        ))}
      </svg>
    ),
    damask: (
      <svg viewBox="0 0 40 40" className="w-8 h-8" fill="none" stroke="#9ca3af" strokeWidth="1.5" aria-hidden="true">
        <path d="M20 5 Q30 10 35 20 Q30 30 20 35 Q10 30 5 20 Q10 10 20 5 Z" />
        <path d="M20 10 Q27 15 30 20 Q27 25 20 30 Q13 25 10 20 Q13 15 20 10 Z" fill="#9ca3af" fillOpacity="0.3" />
      </svg>
    ),
    abstract: (
      <svg viewBox="0 0 40 40" className="w-8 h-8" fill="none" stroke="#9ca3af" strokeWidth="2" aria-hidden="true">
        <path d="M5 20 Q10 5 20 10 Q30 15 35 5" />
        <path d="M5 30 Q15 20 25 25 Q35 30 38 20" />
      </svg>
    ),
    anchor: (
      <svg viewBox="0 0 40 40" className="w-8 h-8" fill="none" stroke="#9ca3af" strokeWidth="2" aria-hidden="true">
        <circle cx="20" cy="10" r="4" />
        <line x1="20" y1="14" x2="20" y2="34" />
        <line x1="8" y1="22" x2="32" y2="22" />
        <path d="M8 34 Q14 28 20 34 Q26 28 32 34" />
      </svg>
    ),
  };
  return iconMap[patternId] ?? <span className="text-gray-400 text-xs">{patternId}</span>;
}

export default LiningStep;
