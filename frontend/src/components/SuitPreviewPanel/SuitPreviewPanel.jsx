import { useState, useRef, useEffect } from 'react';
import useSuitStore from '../../store/suitStore';

// ---------------------------------------------------------------------------
// Debounce hook — uses a ref-based timer (no setTimeout stored in state)
// ---------------------------------------------------------------------------
function useDebounced(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  const timerRef = useRef(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [value, delay]);

  return debouncedValue;
}

// ---------------------------------------------------------------------------
// Lining colour hex map
// ---------------------------------------------------------------------------
const LINING_HEX = {
  navy: '#1B3A6B',
  charcoal: '#36454F',
  black: '#1C1C1C',
  ivory: '#FFFFF0',
  burgundy: '#800020',
  'royal-blue': '#4169E1',
  'forest-green': '#228B22',
  gold: '#FFD700',
  silver: '#C0C0C0',
  teal: '#008080',
  purple: '#800080',
};

// ---------------------------------------------------------------------------
// SuitPreviewPanel
// ---------------------------------------------------------------------------
const SuitPreviewPanel = ({ currentStep = 1, compact = false }) => {
  const { config } = useSuitStore();
  const debouncedConfig = useDebounced(config, 150);
  const [view, setView] = useState('front'); // 'front' | 'back'
  const [isExpanded, setIsExpanded] = useState(false);

  // Store shape: config.style = { breasting: 'single'|'double', buttons: 2|6|1 }
  const isDouble = debouncedConfig?.style?.breasting === 'double';
  const isTuxedo = debouncedConfig?.style?.breasting === 'tuxedo';

  const lapelStyle = debouncedConfig?.lapel?.style ?? 'notch';
  const liningColor = debouncedConfig?.lining?.color ?? null;
  const liningHex = liningColor ? (LINING_HEX[liningColor] ?? '#E5E7EB') : '#E5E7EB';

  // Monogram — store shape: { text, position, font } (no explicit enabled field)
  const monogramText = debouncedConfig?.monogram?.text ?? '';

  const buttonMaterial = debouncedConfig?.details?.buttonMaterial ?? null;
  const ventStyle = debouncedConfig?.details?.ventStyle ?? null;

  const buttonCount = isDouble ? 6 : isTuxedo ? 1 : 2;

  // Config summary items — adapt to actual store field shapes
  const styleLabel = debouncedConfig?.style
    ? `${debouncedConfig.style.breasting}-breasted`
    : null;

  const lapelLabel = debouncedConfig?.lapel
    ? `${debouncedConfig.lapel.style} (${debouncedConfig.lapel.width})`
    : null;

  const liningLabel = debouncedConfig?.lining?.color ?? debouncedConfig?.lining?.pattern ?? null;

  const configSummaryItems = [
    { label: 'Fabric', value: debouncedConfig?.fabric?.name ?? null },
    { label: 'Style', value: styleLabel },
    { label: 'Lapel', value: lapelLabel },
    { label: 'Lining', value: liningLabel },
    { label: 'Buttons', value: debouncedConfig?.details?.buttonMaterial ?? null },
    { label: 'Pocket', value: debouncedConfig?.details?.pocketStyle ?? null },
    { label: 'Vent', value: ventStyle },
    { label: 'Monogram', value: monogramText || null },
  ].filter((item) => item.value != null);

  const showSummary = currentStep >= 7 || configSummaryItems.length >= 4;

  // -------------------------------------------------------------------------
  // SVG preview content (shared between desktop and mobile full-screen)
  // -------------------------------------------------------------------------
  const previewContent = (
    <div className="relative">
      {/* Front/Back toggle */}
      <div className="flex justify-center mb-3">
        <div className="inline-flex rounded-lg border border-gray-200 overflow-hidden">
          {['front', 'back'].map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              className={`px-4 py-1.5 text-xs font-medium transition-colors ${
                view === v
                  ? 'bg-gray-900 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              {v === 'front' ? 'Front View' : 'Back View'}
            </button>
          ))}
        </div>
      </div>

      {/* SVG Preview */}
      <div className="bg-gradient-to-b from-gray-50 to-gray-100 rounded-xl p-4 flex items-center justify-center min-h-[320px]">
        <svg
          viewBox="0 0 200 280"
          className="w-full max-w-[220px]"
          role="img"
          aria-label="Suit preview"
        >
          {view === 'front' ? (
            <g>
              {/* Jacket body */}
              <path
                d={
                  isDouble
                    ? 'M40 30 L30 80 L25 260 L175 260 L170 80 L160 30 L120 50 L100 40 L80 50 Z'
                    : 'M45 30 L32 80 L28 260 L172 260 L168 80 L155 30 L120 50 L100 40 L80 50 Z'
                }
                fill="#2D3748"
                stroke="#1A202C"
                strokeWidth="1.5"
              />

              {/* Left lapel */}
              {lapelStyle === 'notch' && (
                <path
                  d="M100 40 L100 100 L70 120 L55 95 L72 60 Z"
                  fill="#374151"
                  stroke="#1A202C"
                  strokeWidth="1"
                />
              )}
              {lapelStyle === 'peak' && (
                <path
                  d="M100 40 L100 105 L62 125 L48 88 L70 55 Z"
                  fill="#374151"
                  stroke="#1A202C"
                  strokeWidth="1"
                />
              )}
              {lapelStyle === 'shawl' && (
                <path
                  d="M100 40 Q95 65 80 85 Q68 100 70 120 L55 120 L55 80 Q65 55 100 40 Z"
                  fill="#374151"
                  stroke="#1A202C"
                  strokeWidth="1"
                />
              )}

              {/* Right lapel (mirror) */}
              {lapelStyle === 'notch' && (
                <path
                  d="M100 40 L100 100 L130 120 L145 95 L128 60 Z"
                  fill="#374151"
                  stroke="#1A202C"
                  strokeWidth="1"
                />
              )}
              {lapelStyle === 'peak' && (
                <path
                  d="M100 40 L100 105 L138 125 L152 88 L130 55 Z"
                  fill="#374151"
                  stroke="#1A202C"
                  strokeWidth="1"
                />
              )}
              {lapelStyle === 'shawl' && (
                <path
                  d="M100 40 Q105 65 120 85 Q132 100 130 120 L145 120 L145 80 Q135 55 100 40 Z"
                  fill="#374151"
                  stroke="#1A202C"
                  strokeWidth="1"
                />
              )}

              {/* Lining strip at collar */}
              <rect x="88" y="38" width="24" height="8" rx="2" fill={liningHex} opacity="0.9" />

              {/* Buttons */}
              {Array.from({ length: buttonCount }).map((_, i) => (
                <circle
                  key={i}
                  cx={100}
                  cy={130 + i * 22}
                  r={4}
                  fill={
                    buttonMaterial === 'metal'
                      ? '#D4AF37'
                      : buttonMaterial === 'horn'
                        ? '#8B6914'
                        : '#1A202C'
                  }
                  stroke="#111"
                  strokeWidth="0.5"
                />
              ))}

              {/* Pocket */}
              <rect
                x="58"
                y="175"
                width="28"
                height="16"
                rx="2"
                fill="none"
                stroke="#4B5563"
                strokeWidth="1.5"
              />

              {/* Monogram */}
              {monogramText.length > 0 && (
                <text
                  x="100"
                  y="215"
                  textAnchor="middle"
                  fontSize="10"
                  fill="#9CA3AF"
                  fontStyle="italic"
                >
                  {monogramText.slice(0, 3)}
                </text>
              )}
            </g>
          ) : (
            <g>
              {/* Back view — jacket body */}
              <path
                d="M45 30 L32 80 L28 260 L172 260 L168 80 L155 30 Z"
                fill="#2D3748"
                stroke="#1A202C"
                strokeWidth="1.5"
              />
              {/* Center seam */}
              <line
                x1="100"
                y1="30"
                x2="100"
                y2="260"
                stroke="#1A202C"
                strokeWidth="1"
                strokeDasharray="4 3"
              />
              {/* Vent */}
              {ventStyle === 'single' && (
                <line
                  x1="100"
                  y1="200"
                  x2="100"
                  y2="260"
                  stroke="#4B5563"
                  strokeWidth="2.5"
                />
              )}
              {ventStyle === 'double' && (
                <>
                  <line
                    x1="80"
                    y1="200"
                    x2="80"
                    y2="260"
                    stroke="#4B5563"
                    strokeWidth="2"
                  />
                  <line
                    x1="120"
                    y1="200"
                    x2="120"
                    y2="260"
                    stroke="#4B5563"
                    strokeWidth="2"
                  />
                </>
              )}
              {/* Lining strip at collar back */}
              <rect x="88" y="28" width="24" height="10" rx="2" fill={liningHex} opacity="0.8" />
            </g>
          )}
        </svg>
      </div>

      {/* Config summary card */}
      {showSummary && configSummaryItems.length > 0 && (
        <div className="mt-4 bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Your Configuration
          </p>
          <dl className="space-y-1.5">
            {configSummaryItems.map((item) => (
              <div key={item.label} className="flex justify-between text-xs">
                <dt className="text-gray-500">{item.label}</dt>
                <dd className="font-medium text-gray-800 capitalize">{item.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </div>
  );

  // -------------------------------------------------------------------------
  // Mobile compact thumbnail
  // -------------------------------------------------------------------------
  if (compact) {
    return (
      <div className="lg:hidden mb-4">
        <div className="bg-gray-50 rounded-xl p-3 flex items-center gap-3">
          {/* Thumbnail */}
          <div className="w-16 h-20 flex-shrink-0 bg-gray-900 rounded-lg flex items-center justify-center">
            <svg viewBox="0 0 60 80" className="w-12 h-16" aria-hidden="true">
              <path
                d="M12 8 L8 25 L7 72 L53 72 L52 25 L48 8 L36 14 L30 11 L24 14 Z"
                fill="#374151"
              />
              <rect x="26" y="10" width="8" height="3" rx="1" fill={liningHex} />
            </svg>
          </div>

          <div className="flex-1">
            <p className="text-sm font-medium text-gray-800">
              {debouncedConfig?.style
                ? `${debouncedConfig.style.breasting}-breasted`
                : 'Your Suit'}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              {configSummaryItems.length} of 6 options selected
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsExpanded(true)}
            className="text-xs bg-gray-900 text-white px-3 py-1.5 rounded-lg"
          >
            Preview
          </button>
        </div>

        {/* Full-screen modal on mobile */}
        {isExpanded && (
          <div className="fixed inset-0 z-50 bg-white overflow-y-auto p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-semibold text-gray-900">Suit Preview</h2>
              <button
                type="button"
                onClick={() => setIsExpanded(false)}
                className="text-gray-500 hover:text-gray-800 text-sm underline"
              >
                Close
              </button>
            </div>
            {previewContent}
          </div>
        )}
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Desktop sticky panel
  // -------------------------------------------------------------------------
  return (
    <div className="hidden lg:block sticky top-6">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Live Preview</h3>
      {previewContent}
    </div>
  );
};

export default SuitPreviewPanel;
