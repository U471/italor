import { useState } from 'react';
import {
  STANDARD_SIZE_LABELS,
  STANDARD_SIZES,
  SIZE_CHART_ROWS,
} from '../../constants/standardSizes';

/**
 * SizeChartModal — SCRUM-33
 * Displays a size selection grid (XS → 3XL) and a horizontally-scrollable
 * measurement table. Confirming a size calls onApply(sizeKey).
 */
function SizeChartModal({ onApply, onClose }) {
  const [selected, setSelected] = useState(null);

  const handleApply = () => {
    if (!selected) { return; }
    onApply(selected);
  };

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="size-chart-title"
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 id="size-chart-title" className="text-lg font-semibold text-gray-900">
            Select Standard Size
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close size chart"
            className="w-8 h-8 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            ✕
          </button>
        </div>

        {/* ── Body ────────────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

          {/* Size grid */}
          <div>
            <p className="text-sm text-gray-500 mb-3">
              Choose the size that best matches your body. You can always update measurements later.
            </p>
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
              {STANDARD_SIZE_LABELS.map((sizeKey) => {
                const isSelected = selected === sizeKey;
                return (
                  <button
                    key={sizeKey}
                    type="button"
                    onClick={() => setSelected(sizeKey)}
                    aria-pressed={isSelected}
                    className={`py-3 rounded-xl border-2 text-sm font-semibold transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-indigo-400 ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-600 text-white'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-indigo-300 hover:bg-indigo-50'
                    }`}
                  >
                    {sizeKey}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Size chart table — horizontally scrollable on mobile */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Size Chart</h3>
            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="min-w-full text-sm text-center" aria-label="Standard size chart">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="sticky left-0 bg-gray-50 px-4 py-2.5 text-left text-xs font-semibold text-gray-600 whitespace-nowrap border-r border-gray-200"
                    >
                      Measurement
                    </th>
                    {STANDARD_SIZE_LABELS.map((sizeKey) => (
                      <th
                        key={sizeKey}
                        scope="col"
                        className={`px-4 py-2.5 text-xs font-semibold whitespace-nowrap ${
                          selected === sizeKey
                            ? 'bg-indigo-50 text-indigo-700'
                            : 'text-gray-600'
                        }`}
                      >
                        {sizeKey}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {SIZE_CHART_ROWS.map((row, idx) => (
                    <tr key={row.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                      <td className="sticky left-0 bg-inherit px-4 py-2 text-left text-xs font-medium text-gray-700 whitespace-nowrap border-r border-gray-200">
                        {row.label}
                      </td>
                      {STANDARD_SIZE_LABELS.map((sizeKey) => (
                        <td
                          key={sizeKey}
                          className={`px-4 py-2 text-xs text-gray-700 whitespace-nowrap ${
                            selected === sizeKey ? 'bg-indigo-50 font-semibold text-indigo-700' : ''
                          }`}
                        >
                          {STANDARD_SIZES[sizeKey][row.id]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recommendation note */}
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
            Standard sizes are a starting point. For the best fit, provide custom measurements after ordering.
          </p>
        </div>

        {/* ── Footer ──────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-400"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApply}
            disabled={!selected}
            className="px-5 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {selected ? `Apply Size ${selected}` : 'Select a Size'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default SizeChartModal;
