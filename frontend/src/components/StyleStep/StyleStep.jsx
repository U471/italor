import useSuitStore from '../../store/suitStore';
import { SUIT_STYLES } from '../../constants/suitStyles';

/**
 * StyleStep — SCRUM-24
 * Lets the user choose a suit style from the SUIT_STYLES constants.
 * Reads and writes directly from/to suitStore.
 */
function StyleStep() {
  const { config, setStyle } = useSuitStore();
  const current = config.style;

  function handleStyleSelect(option) {
    setStyle({ id: option.id, label: option.label });
  }

  return (
    <div>
      <p className="text-gray-500 text-sm mb-6">
        Choose the cut that best suits your style. This defines the overall silhouette of your suit.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        {SUIT_STYLES.map((option) => {
          const isSelected = current?.id === option.id;
          return (
            <button
              key={option.id}
              type="button"
              aria-pressed={isSelected}
              onClick={() => handleStyleSelect(option)}
              className={`flex flex-col items-start text-left p-6 rounded-xl border-2 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-indigo-400 ${
                isSelected
                  ? 'ring-2 ring-indigo-600 bg-indigo-50 border-indigo-600 text-indigo-800'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              {option.previewImageUrl && (
                <img
                  src={option.previewImageUrl}
                  alt={option.label}
                  className="w-16 h-20 object-contain mb-3 rounded"
                  aria-hidden="true"
                />
              )}
              <span className="text-base font-semibold">{option.label}</span>
              <span className="mt-1 text-xs leading-relaxed">{option.description}</span>
              {option.tuxedoNote && (
                <span className="mt-2 text-xs text-indigo-600 font-medium">{option.tuxedoNote}</span>
              )}
            </button>
          );
        })}
      </div>

      {!current && (
        <p className="text-xs text-gray-400 mt-2">Select a style above to continue.</p>
      )}
    </div>
  );
}

export default StyleStep;
