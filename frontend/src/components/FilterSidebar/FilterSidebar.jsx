/**
 * FilterSidebar — fabric catalog filters: material, color, pattern, price range.
 * Controlled by URL search params (passed down as `filters` + `onChange`).
 */
function FilterSidebar({ filters, options, onChange, onReset }) {
  const { materials = [], colors = [], patterns = [] } = options || {};

  function handleSelect(key, value) {
    onChange({ ...filters, [key]: filters[key] === value ? '' : value, page: '1' });
  }

  function handlePrice(key, value) {
    onChange({ ...filters, [key]: value, page: '1' });
  }

  const hasActiveFilters = filters.material || filters.color || filters.pattern || filters.minPrice || filters.maxPrice;

  return (
    <aside aria-label="filter sidebar" className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Filters</h2>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onReset}
            className="text-xs text-brand-600 hover:text-brand-700 font-medium"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Material */}
      {materials.length > 0 && (
        <section>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Material</h3>
          <ul className="space-y-1">
            {materials.map((m) => (
              <li key={m}>
                <button
                  type="button"
                  onClick={() => handleSelect('material', m)}
                  className={`w-full text-left px-3 py-1.5 rounded-lg text-sm capitalize transition-colors ${
                    filters.material === m
                      ? 'bg-brand-50 text-brand-700 font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {m}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Color */}
      {colors.length > 0 && (
        <section>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Color</h3>
          <ul className="space-y-1">
            {colors.map((c) => (
              <li key={c}>
                <button
                  type="button"
                  onClick={() => handleSelect('color', c)}
                  className={`w-full text-left px-3 py-1.5 rounded-lg text-sm capitalize transition-colors ${
                    filters.color === c
                      ? 'bg-brand-50 text-brand-700 font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {c}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Pattern */}
      {patterns.length > 0 && (
        <section>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Pattern</h3>
          <ul className="space-y-1">
            {patterns.map((p) => (
              <li key={p}>
                <button
                  type="button"
                  onClick={() => handleSelect('pattern', p)}
                  className={`w-full text-left px-3 py-1.5 rounded-lg text-sm capitalize transition-colors ${
                    filters.pattern === p
                      ? 'bg-brand-50 text-brand-700 font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {p}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Price range */}
      <section>
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Price (£/m)</h3>
        <div className="flex items-center gap-2">
          <input
            type="number"
            aria-label="minimum price"
            placeholder="Min"
            min={0}
            value={filters.minPrice || ''}
            onChange={(e) => handlePrice('minPrice', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
          />
          <span className="text-gray-400 text-sm">–</span>
          <input
            type="number"
            aria-label="maximum price"
            placeholder="Max"
            min={0}
            value={filters.maxPrice || ''}
            onChange={(e) => handlePrice('maxPrice', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
          />
        </div>
      </section>
    </aside>
  );
}

export default FilterSidebar;
