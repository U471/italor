import useSuitStore from '../../store/suitStore';

const BREASTING_OPTIONS = [
  {
    value: 'single',
    label: 'Single Breasted',
    description: 'Classic, versatile, and the most popular choice. One row of buttons with a narrow overlap.',
    icon: (
      <svg viewBox="0 0 80 100" className="w-16 h-20" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="10" y="5" width="60" height="90" rx="4" />
        <line x1="40" y1="5" x2="40" y2="95" strokeDasharray="3 3" />
        <circle cx="40" cy="35" r="3" fill="currentColor" />
        <circle cx="40" cy="50" r="3" fill="currentColor" />
        <line x1="10" y1="30" x2="30" y2="30" />
        <line x1="50" y1="30" x2="70" y2="30" />
        <path d="M20 5 Q20 20 10 25" />
        <path d="M60 5 Q60 20 70 25" />
      </svg>
    ),
    buttonOptions: [1, 2, 3],
    defaultButtons: 2,
  },
  {
    value: 'double',
    label: 'Double Breasted',
    description: 'Bold and commanding. Two parallel rows of buttons with a wide overlap for a powerful silhouette.',
    icon: (
      <svg viewBox="0 0 80 100" className="w-16 h-20" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="10" y="5" width="60" height="90" rx="4" />
        <line x1="35" y1="5" x2="35" y2="95" strokeDasharray="3 3" />
        <circle cx="30" cy="35" r="3" fill="currentColor" />
        <circle cx="50" cy="35" r="3" fill="currentColor" />
        <circle cx="30" cy="50" r="3" fill="currentColor" />
        <circle cx="50" cy="50" r="3" fill="currentColor" />
        <circle cx="30" cy="65" r="3" fill="currentColor" />
        <circle cx="50" cy="65" r="3" fill="currentColor" />
        <line x1="10" y1="30" x2="25" y2="30" />
        <line x1="55" y1="30" x2="70" y2="30" />
        <path d="M20 5 Q20 20 10 25" />
        <path d="M60 5 Q60 20 70 25" />
      </svg>
    ),
    buttonOptions: [4, 6],
    defaultButtons: 6,
  },
];

/**
 * StyleStep — SCRUM-24
 * Lets the user choose breasting (single/double) and button count.
 * Reads and writes directly from/to suitStore.
 */
function StyleStep() {
  const { config, setStyle } = useSuitStore();
  const current = config.style;

  function handleBreastingSelect(option) {
    setStyle({
      breasting: option.value,
      buttons: current?.breasting === option.value ? current.buttons : option.defaultButtons,
    });
  }

  function handleButtonSelect(count) {
    setStyle({ ...current, buttons: count });
  }

  const selectedOption = BREASTING_OPTIONS.find((o) => o.value === current?.breasting);

  return (
    <div>
      <p className="text-gray-500 text-sm mb-6">
        Choose the cut that best suits your style. This defines the overall silhouette of your suit.
      </p>

      {/* Breasting selector */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        {BREASTING_OPTIONS.map((option) => {
          const isSelected = current?.breasting === option.value;
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={isSelected}
              onClick={() => handleBreastingSelect(option)}
              className={`flex flex-col items-center text-center p-6 rounded-xl border-2 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-brand-400 ${
                isSelected
                  ? 'border-brand-600 bg-brand-50 text-brand-800'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <span className={isSelected ? 'text-brand-600' : 'text-gray-400'}>
                {option.icon}
              </span>
              <span className="mt-3 text-base font-semibold">{option.label}</span>
              <span className="mt-1 text-xs leading-relaxed">{option.description}</span>
            </button>
          );
        })}
      </div>

      {/* Button count selector — shown only once a breasting is picked */}
      {selectedOption && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            Number of Buttons
          </h3>
          <div className="flex gap-3 flex-wrap">
            {selectedOption.buttonOptions.map((count) => {
              const isActive = current?.buttons === count;
              return (
                <button
                  key={count}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => handleButtonSelect(count)}
                  className={`w-14 h-14 rounded-xl border-2 text-sm font-bold transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-brand-400 ${
                    isActive
                      ? 'border-brand-600 bg-brand-600 text-white'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {count}
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-xs text-gray-400">
            {current?.buttons}-button {current?.breasting}-breasted selected
          </p>
        </div>
      )}

      {!current && (
        <p className="text-xs text-gray-400 mt-2">Select a style above to continue.</p>
      )}
    </div>
  );
}

export default StyleStep;
