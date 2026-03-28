import useSuitStore from '../../store/suitStore';
import {
  MONOGRAM_FONTS,
  MONOGRAM_COLORS,
  MONOGRAM_PLACEMENTS,
  MAX_MONOGRAM_LENGTH,
} from '../../constants/monogramOptions';

/**
 * MonogramStep — SCRUM-28
 * Lets the user add a personalized monogram:
 *   1. Text input (max 20 chars)
 *   2. Font selector (5 fonts with rendered previews)
 *   3. 20 thread colors
 *   4. Placement selector (Inner breast pocket, Left sleeve, Collar)
 * Optional step with "Skip monogram" toggle.
 * Monograms are complimentary (FREE).
 */
function MonogramStep() {
  const { config, setMonogram } = useSuitStore();
  const monogram = config.monogram;
  const enabled = monogram?.enabled !== false; // default enabled

  function handleToggleEnabled() {
    setMonogram({ ...monogram, enabled: !enabled });
  }

  function handleTextChange(e) {
    const text = e.target.value.slice(0, MAX_MONOGRAM_LENGTH);
    setMonogram({ ...monogram, text, enabled: true });
  }

  function handleFontSelect(fontId) {
    setMonogram({ ...monogram, font: fontId, enabled: true });
  }

  function handleColorSelect(colorId) {
    setMonogram({ ...monogram, color: colorId, enabled: true });
  }

  function handlePlacementSelect(placementId) {
    setMonogram({ ...monogram, placement: placementId, enabled: true });
  }

  const selectedFont = MONOGRAM_FONTS.find((f) => f.id === monogram?.font) ?? MONOGRAM_FONTS[0];
  const selectedColor = MONOGRAM_COLORS.find((c) => c.id === monogram?.color) ?? MONOGRAM_COLORS[0];
  const previewText = monogram?.text || 'ABC';

  return (
    <div className="space-y-6">
      {/* Header + Skip toggle */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-1">Monogram &amp; Personalization</h2>
          <p className="text-sm text-gray-500">
            Add your initials or a personal message.{' '}
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-medium">
              FREE
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Skip</span>
          <button
            type="button"
            role="switch"
            aria-checked={!enabled}
            onClick={handleToggleEnabled}
            className={`relative w-10 h-6 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-400 ${
              !enabled ? 'bg-indigo-600' : 'bg-gray-200'
            }`}
          >
            <span
              className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                !enabled ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {!enabled ? (
        <div className="p-6 bg-gray-50 rounded-xl text-center text-gray-400 text-sm">
          Monogram skipped —{' '}
          <span className="font-medium text-gray-600">No monogram</span> will appear in your order summary.
        </div>
      ) : (
        <>
          {/* Live Preview */}
          <div className="bg-gray-900 rounded-xl p-6 flex items-center justify-center min-h-[120px]">
            <span
              style={{
                fontFamily: selectedFont.fontFamily,
                fontStyle: selectedFont.fontStyle ?? 'normal',
                color: selectedColor.hexCode,
                fontSize: '2.5rem',
                letterSpacing: '0.15em',
                textShadow:
                  selectedColor.hexCode === '#FFFFFF'
                    ? '0 0 8px rgba(255,255,255,0.4)'
                    : 'none',
              }}
            >
              {previewText}
            </span>
          </div>

          {/* Text Input */}
          <div>
            <label htmlFor="monogram-text" className="block text-sm font-medium text-gray-700 mb-1">
              Your Text{' '}
              <span className="text-gray-400 font-normal">(max {MAX_MONOGRAM_LENGTH} characters)</span>
            </label>
            <div className="relative">
              <input
                id="monogram-text"
                type="text"
                maxLength={MAX_MONOGRAM_LENGTH}
                value={monogram?.text ?? ''}
                onChange={handleTextChange}
                placeholder="e.g. JRS or John R. Smith"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                {(monogram?.text ?? '').length}/{MAX_MONOGRAM_LENGTH}
              </span>
            </div>
          </div>

          {/* Font Selector */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Font Style</h3>
            <div className="grid grid-cols-5 gap-2">
              {MONOGRAM_FONTS.map((font) => (
                <button
                  key={font.id}
                  type="button"
                  onClick={() => handleFontSelect(font.id)}
                  className={`p-3 rounded-lg border-2 text-center transition-all ${
                    monogram?.font === font.id
                      ? 'ring-2 ring-indigo-600 bg-indigo-50 border-indigo-600'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <span
                    style={{
                      fontFamily: font.fontFamily,
                      fontStyle: font.fontStyle ?? 'normal',
                      fontSize: '1.25rem',
                    }}
                  >
                    {font.preview}
                  </span>
                  <p className="text-xs text-gray-500 mt-1 leading-tight">{font.label}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Color Picker */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Thread Color</h3>
            <div className="flex flex-wrap gap-2">
              {MONOGRAM_COLORS.map((color) => (
                <div key={color.id} className="relative group">
                  <button
                    type="button"
                    onClick={() => handleColorSelect(color.id)}
                    className={`w-8 h-8 rounded-full border-2 transition-all hover:scale-110 ${
                      monogram?.color === color.id
                        ? 'ring-2 ring-offset-2 ring-indigo-600 border-indigo-600'
                        : 'border-gray-200'
                    }`}
                    style={{ backgroundColor: color.hexCode }}
                    title={color.name}
                  />
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block z-10 pointer-events-none">
                    <div className="bg-gray-900 text-white text-xs rounded px-2 py-0.5 whitespace-nowrap">
                      {color.name}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Placement */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Placement</h3>
            <div className="grid grid-cols-3 gap-3">
              {MONOGRAM_PLACEMENTS.map((placement) => (
                <button
                  key={placement.id}
                  type="button"
                  onClick={() => handlePlacementSelect(placement.id)}
                  className={`p-3 rounded-xl border-2 text-left transition-all ${
                    monogram?.placement === placement.id
                      ? 'ring-2 ring-indigo-600 bg-indigo-50 border-indigo-600'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <p className="text-sm font-medium text-gray-900">{placement.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{placement.description}</p>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default MonogramStep;
