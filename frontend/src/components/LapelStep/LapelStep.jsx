import { useEffect } from 'react';
import useSuitStore from '../../store/suitStore';

const LAPEL_STYLES = [
  {
    value: 'notch',
    label: 'Notch Lapel',
    description: 'The most common lapel. A V-shaped notch cut where the collar meets the lapel — timeless and versatile.',
    icon: (
      <svg viewBox="0 0 80 100" className="w-14 h-18" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="12" y="5" width="56" height="90" rx="3" />
        <path d="M40 5 L40 95" strokeDasharray="3 3" />
        {/* Left lapel with notch */}
        <path d="M40 5 L40 30 L22 45 L12 35 L20 20 Z" fill="currentColor" fillOpacity="0.15" />
        {/* Right lapel with notch */}
        <path d="M40 5 L40 30 L58 45 L68 35 L60 20 Z" fill="currentColor" fillOpacity="0.15" />
        {/* Notch cuts */}
        <path d="M22 45 L30 38" />
        <path d="M58 45 L50 38" />
      </svg>
    ),
  },
  {
    value: 'peak',
    label: 'Peak Lapel',
    description: 'Points upward toward the shoulders for a bold, powerful look. A mark of formal and double-breasted suits.',
    icon: (
      <svg viewBox="0 0 80 100" className="w-14 h-18" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="12" y="5" width="56" height="90" rx="3" />
        <path d="M40 5 L40 95" strokeDasharray="3 3" />
        {/* Left peak lapel — points upward */}
        <path d="M40 5 L40 35 L18 50 L10 30 L26 15 Z" fill="currentColor" fillOpacity="0.15" />
        {/* Right peak lapel */}
        <path d="M40 5 L40 35 L62 50 L70 30 L54 15 Z" fill="currentColor" fillOpacity="0.15" />
      </svg>
    ),
  },
  {
    value: 'shawl',
    label: 'Shawl Lapel',
    description: 'A smooth, rounded collar with no notch or break. Elegant and understated — the classic choice for black tie.',
    icon: (
      <svg viewBox="0 0 80 100" className="w-14 h-18" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="12" y="5" width="56" height="90" rx="3" />
        <path d="M40 5 L40 95" strokeDasharray="3 3" />
        {/* Left shawl — smooth curve, no notch */}
        <path d="M40 5 Q40 20 30 30 Q20 40 22 50 L12 50 L12 30 Q18 15 40 5 Z" fill="currentColor" fillOpacity="0.15" />
        {/* Right shawl */}
        <path d="M40 5 Q40 20 50 30 Q60 40 58 50 L68 50 L68 30 Q62 15 40 5 Z" fill="currentColor" fillOpacity="0.15" />
      </svg>
    ),
  },
];

const WIDTH_OPTIONS = [
  { value: 'narrow', label: 'Narrow (6 cm)' },
  { value: 'regular', label: 'Regular (8 cm)' },
  { value: 'wide', label: 'Wide (10 cm)' },
];

/**
 * LapelStep — SCRUM-25
 * Lets the user choose lapel style (notch/peak/shawl) and width.
 * Reads and writes directly from/to suitStore.
 * Auto-selects shawl lapel when tuxedo suit style is chosen.
 */
function LapelStep() {
  const { config, setLapel } = useSuitStore();
  const current = config.lapel;

  // Auto-select shawl + regular width when tuxedo style is chosen
  useEffect(() => {
    const styleId = config?.style?.id;
    if (styleId === 'tuxedo' && !current) {
      setLapel({ style: 'shawl', width: 'regular' });
    }
  }, []); // run on mount

  function handleStyleSelect(styleValue) {
    setLapel({
      style: styleValue,
      width: current?.style === styleValue ? (current.width ?? 'regular') : 'regular',
    });
  }

  function handleWidthSelect(widthValue) {
    setLapel({ ...current, width: widthValue });
  }

  return (
    <div>
      <p className="text-gray-500 text-sm mb-6">
        The lapel defines the character of your suit. Choose the style that best reflects your personality.
      </p>

      {/* Lapel style cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {LAPEL_STYLES.map((option) => {
          const isSelected = current?.style === option.value;
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={isSelected}
              onClick={() => handleStyleSelect(option.value)}
              className={`flex flex-col items-center text-center p-5 rounded-xl border-2 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-brand-400 ${
                isSelected
                  ? 'border-brand-600 bg-brand-50 text-brand-800'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <span className={isSelected ? 'text-brand-600' : 'text-gray-400'}>
                {option.icon}
              </span>
              <span className="mt-3 text-sm font-semibold">{option.label}</span>
              <span className="mt-1 text-xs leading-relaxed">{option.description}</span>
            </button>
          );
        })}
      </div>

      {/* Width selector — shown once a lapel style is picked */}
      {current?.style && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Lapel Width</h3>
          <div className="flex gap-3 flex-wrap">
            {WIDTH_OPTIONS.map((w) => {
              const isActive = current?.width === w.value;
              return (
                <button
                  key={w.value}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => handleWidthSelect(w.value)}
                  className={`flex flex-col items-center px-5 py-3 rounded-xl border-2 text-sm transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-brand-400 ${
                    isActive
                      ? 'border-brand-600 bg-brand-600 text-white'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <span className="font-semibold">{w.label}</span>
                </button>
              );
            })}
          </div>

          <p className="mt-3 text-xs text-gray-400 capitalize">
            {current.width} {current.style} lapel selected
          </p>
        </div>
      )}

      {!current && (
        <p className="text-xs text-gray-400 mt-2">Select a lapel style above to continue.</p>
      )}
    </div>
  );
}

export default LapelStep;
