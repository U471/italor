import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getFabrics } from '../../services/api';
import FabricCard from '../FabricCard/FabricCard';
import FabricCardSkeleton from '../FabricCard/FabricCardSkeleton';

const FEATURED_COUNT = 6;

/**
 * FeaturedFabrics — homepage section displaying the 6 newest active fabrics.
 * Links to the full catalog at /fabrics.
 */
function FeaturedFabrics() {
  const [fabrics, setFabrics] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await getFabrics({ limit: FEATURED_COUNT, sort: 'newest' });
        if (!cancelled) {
          setFabrics(data.fabrics);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Failed to load fabrics.');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  return (
    <section aria-labelledby="featured-fabrics-heading" className="py-16 px-4 max-w-7xl mx-auto">
      <div className="flex items-end justify-between mb-8">
        <div>
          <h2
            id="featured-fabrics-heading"
            className="text-3xl font-serif font-bold text-gray-900"
          >
            Featured Fabrics
          </h2>
          <p className="mt-2 text-gray-500 text-sm">
            Hand-selected Italian and European cloths for the discerning tailor.
          </p>
        </div>
        <Link
          to="/fabrics"
          className="text-sm font-medium text-brand-600 hover:text-brand-800 transition-colors whitespace-nowrap ml-4"
        >
          View all fabrics →
        </Link>
      </div>

      {error && (
        <p role="alert" className="text-red-600 text-sm">
          {error}
        </p>
      )}

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {Array.from({ length: FEATURED_COUNT }).map((_, i) => (
            <FabricCardSkeleton key={i} />
          ))}
        </div>
      ) : fabrics.length === 0 && !error ? (
        <p className="text-gray-400 text-sm">No fabrics available yet.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {fabrics.map((fabric) => (
            <FabricCard key={fabric._id} fabric={fabric} />
          ))}
        </div>
      )}
    </section>
  );
}

export default FeaturedFabrics;
