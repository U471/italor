import { Link } from 'react-router-dom';

/**
 * FabricCard — displays a single fabric swatch in the catalog grid.
 * Links to the fabric detail page at /fabrics/:id.
 */
function FabricCard({ fabric }) {
  const { _id, name, material, pattern, price, thumbnailUrl, origin } = fabric;

  return (
    <Link
      to={`/fabrics/${_id}`}
      className="group block bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md hover:border-brand-300 transition-all duration-200"
      aria-label={`${name} — £${price}`}
    >
      {/* Swatch image / color placeholder */}
      <div className="aspect-square bg-gray-100 overflow-hidden">
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center text-4xl select-none"
            style={{ background: `linear-gradient(135deg, #f3f4f6, #e5e7eb)` }}
            aria-hidden="true"
          >
            🧵
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 text-sm leading-tight truncate group-hover:text-brand-700 transition-colors">
          {name}
        </h3>

        <div className="mt-1 flex items-center gap-2 flex-wrap">
          <span className="inline-block text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full capitalize">
            {material}
          </span>
          <span className="inline-block text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full capitalize">
            {pattern}
          </span>
        </div>

        {origin && (
          <p className="mt-1 text-xs text-gray-400">{origin}</p>
        )}

        <p className="mt-2 text-base font-bold text-gray-900">
          £{price.toLocaleString()}
          <span className="text-xs font-normal text-gray-500 ml-1">/ meter</span>
        </p>
      </div>
    </Link>
  );
}

export default FabricCard;
