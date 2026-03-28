import { useState } from 'react';

const MATERIALS = ['wool', 'cotton', 'linen', 'silk', 'polyester', 'cashmere', 'blend'];
const PATTERNS = ['solid', 'striped', 'checked', 'herringbone', 'plaid', 'houndstooth', 'pinstripe'];
const SEASONS = ['all-year', 'summer', 'winter', 'spring-autumn'];

const EMPTY = {
  name: '', description: '', material: 'wool', color: '', pattern: 'solid',
  price: '', weight: '', origin: '', season: 'all-year',
  careInstructions: '', patternDescription: '', tags: '', stock: '', isActive: true,
};

/**
 * AdminFabricForm — controlled form for creating or editing a fabric.
 *
 * Props:
 *  - initialValues: object  (omit for create, pass fabric for edit)
 *  - onSubmit: (values) => Promise<void>
 *  - onCancel: () => void
 *  - isLoading: boolean
 *  - error: string
 */
function AdminFabricForm({ initialValues, onSubmit, onCancel, isLoading = false, error = '' }) {
  const init = initialValues
    ? {
        ...EMPTY,
        ...initialValues,
        price: initialValues.price ?? '',
        weight: initialValues.weight ?? '',
        stock: initialValues.stock ?? '',
        tags: Array.isArray(initialValues.tags) ? initialValues.tags.join(', ') : (initialValues.tags || ''),
      }
    : EMPTY;

  const [values, setValues] = useState(init);

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setValues((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    const payload = {
      ...values,
      price: values.price !== '' ? Number(values.price) : undefined,
      weight: values.weight !== '' ? Number(values.weight) : undefined,
      stock: values.stock !== '' ? Number(values.stock) : undefined,
      tags: values.tags ? values.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
    };
    onSubmit(payload);
  }

  return (
    <form onSubmit={handleSubmit} noValidate aria-label="fabric form">
      {error && (
        <div role="alert" className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Name */}
        <div className="sm:col-span-2">
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Name <span className="text-red-500">*</span>
          </label>
          <input
            id="name" name="name" type="text" required
            value={values.name} onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
        </div>

        {/* Description */}
        <div className="sm:col-span-2">
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            id="description" name="description" rows={2}
            value={values.description} onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
        </div>

        {/* Material */}
        <div>
          <label htmlFor="material" className="block text-sm font-medium text-gray-700 mb-1">
            Material <span className="text-red-500">*</span>
          </label>
          <select
            id="material" name="material" required
            value={values.material} onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white"
          >
            {MATERIALS.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>

        {/* Pattern */}
        <div>
          <label htmlFor="pattern" className="block text-sm font-medium text-gray-700 mb-1">
            Pattern <span className="text-red-500">*</span>
          </label>
          <select
            id="pattern" name="pattern" required
            value={values.pattern} onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white"
          >
            {PATTERNS.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>

        {/* Color */}
        <div>
          <label htmlFor="color" className="block text-sm font-medium text-gray-700 mb-1">
            Color <span className="text-red-500">*</span>
          </label>
          <input
            id="color" name="color" type="text" required
            value={values.color} onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
        </div>

        {/* Price */}
        <div>
          <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
            Price (£/m) <span className="text-red-500">*</span>
          </label>
          <input
            id="price" name="price" type="number" min="0" step="0.01" required
            value={values.price} onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
        </div>

        {/* Weight */}
        <div>
          <label htmlFor="weight" className="block text-sm font-medium text-gray-700 mb-1">Weight (GSM)</label>
          <input
            id="weight" name="weight" type="number" min="0"
            value={values.weight} onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
        </div>

        {/* Origin */}
        <div>
          <label htmlFor="origin" className="block text-sm font-medium text-gray-700 mb-1">Origin</label>
          <input
            id="origin" name="origin" type="text"
            value={values.origin} onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
        </div>

        {/* Season */}
        <div>
          <label htmlFor="season" className="block text-sm font-medium text-gray-700 mb-1">Season</label>
          <select
            id="season" name="season"
            value={values.season} onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white"
          >
            {SEASONS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {/* Stock */}
        <div>
          <label htmlFor="stock" className="block text-sm font-medium text-gray-700 mb-1">Stock (meters)</label>
          <input
            id="stock" name="stock" type="number" min="0"
            value={values.stock} onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
        </div>

        {/* Tags */}
        <div className="sm:col-span-2">
          <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-1">
            Tags <span className="text-xs text-gray-400">(comma-separated)</span>
          </label>
          <input
            id="tags" name="tags" type="text"
            placeholder="premium, italian, merino"
            value={values.tags} onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
        </div>

        {/* Care Instructions */}
        <div className="sm:col-span-2">
          <label htmlFor="careInstructions" className="block text-sm font-medium text-gray-700 mb-1">Care Instructions</label>
          <input
            id="careInstructions" name="careInstructions" type="text"
            value={values.careInstructions} onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
        </div>

        {/* Pattern Description */}
        <div className="sm:col-span-2">
          <label htmlFor="patternDescription" className="block text-sm font-medium text-gray-700 mb-1">Pattern Description</label>
          <textarea
            id="patternDescription" name="patternDescription" rows={2}
            value={values.patternDescription} onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
        </div>

        {/* Active toggle */}
        <div className="sm:col-span-2 flex items-center gap-3">
          <input
            id="isActive" name="isActive" type="checkbox"
            checked={values.isActive} onChange={handleChange}
            className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
          />
          <label htmlFor="isActive" className="text-sm font-medium text-gray-700">Active (visible in catalog)</label>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-6 flex items-center gap-3 justify-end">
        <button
          type="button" onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit" disabled={isLoading}
          className="px-6 py-2 text-sm font-semibold text-white bg-gray-900 rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? 'Saving…' : initialValues ? 'Update Fabric' : 'Create Fabric'}
        </button>
      </div>
    </form>
  );
}

export default AdminFabricForm;
