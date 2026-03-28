import { useEffect, useState, useCallback, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { getFabrics, getFabricFilters } from '../services/api';
import FabricCard from '../components/FabricCard/FabricCard';
import FabricCardSkeleton from '../components/FabricCard/FabricCardSkeleton';
import FilterSidebar from '../components/FilterSidebar/FilterSidebar';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'name_asc', label: 'Name: A–Z' },
];

const SKELETON_COUNT = 24;

/**
 * FabricCatalogPage — /fabrics
 *
 * Browsable fabric catalog with:
 *  - Filter sidebar (material, color, pattern, price range)
 *  - Debounced search bar (300 ms)
 *  - Sort dropdown
 *  - Pagination (prev/next)
 *  - Skeleton loading cards
 *  - URL params for shareable/bookmarkable state
 */
function FabricCatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [fabrics, setFabrics] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterOptions, setFilterOptions] = useState({ materials: [], colors: [], patterns: [] });
  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '');
  const debounceRef = useRef(null);

  // Derive filters from URL params
  const filters = {
    search: searchParams.get('search') || '',
    material: searchParams.get('material') || '',
    color: searchParams.get('color') || '',
    pattern: searchParams.get('pattern') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    sort: searchParams.get('sort') || 'newest',
    page: searchParams.get('page') || '1',
  };

  // Load filter options once
  useEffect(() => {
    getFabricFilters()
      .then(setFilterOptions)
      .catch(() => {}); // non-fatal
  }, []);

  // Load fabrics whenever URL params change
  useEffect(() => {
    setIsLoading(true);
    setError('');

    const params = {};
    if (filters.search) { params.search = filters.search; }
    if (filters.material) { params.material = filters.material; }
    if (filters.color) { params.color = filters.color; }
    if (filters.pattern) { params.pattern = filters.pattern; }
    if (filters.minPrice) { params.minPrice = filters.minPrice; }
    if (filters.maxPrice) { params.maxPrice = filters.maxPrice; }
    if (filters.sort) { params.sort = filters.sort; }
    params.page = filters.page;
    params.limit = '24';

    getFabrics(params)
      .then((result) => {
        setFabrics(result.fabrics);
        setTotal(result.total);
        setPages(result.pages);
      })
      .catch(() => setError('Failed to load fabrics. Please try again.'))
      .finally(() => setIsLoading(false));
  }, [searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  function updateParams(updates) {
    const next = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([k, v]) => {
      if (v) { next.set(k, v); } else { next.delete(k); }
    });
    setSearchParams(next);
  }

  // Debounced search
  const handleSearchChange = useCallback((value) => {
    setSearchInput(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      updateParams({ search: value, page: '1' });
    }, 300);
  }, [searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleFilterChange(newFilters) {
    updateParams(newFilters);
  }

  function handleReset() {
    setSearchInput('');
    setSearchParams(new URLSearchParams());
  }

  function handleSort(value) {
    updateParams({ sort: value, page: '1' });
  }

  function handlePage(newPage) {
    updateParams({ page: String(newPage) });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const currentPage = parseInt(filters.page, 10) || 1;

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <Link to="/" className="text-2xl font-serif font-bold text-gray-900 tracking-tight hover:text-brand-700 transition-colors">
                iTailor
              </Link>
              <p className="text-sm text-gray-500 mt-0.5">Fabric Catalog</p>
            </div>
            <Link to="/dashboard" className="text-sm text-brand-600 hover:text-brand-700 font-medium">
              Dashboard
            </Link>
          </div>

          {/* Search bar */}
          <div className="mt-4">
            <input
              type="search"
              aria-label="search fabrics"
              placeholder="Search fabrics — e.g. Italian wool, herringbone…"
              value={searchInput}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent text-sm"
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Sidebar */}
          <div className="hidden lg:block w-56 flex-shrink-0">
            <FilterSidebar
              filters={filters}
              options={filterOptions}
              onChange={handleFilterChange}
              onReset={handleReset}
            />
          </div>

          {/* Main content */}
          <div className="flex-1 min-w-0">
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-5">
              <p className="text-sm text-gray-600">
                {isLoading ? (
                  <span className="inline-block w-28 h-4 bg-gray-200 rounded animate-pulse" />
                ) : (
                  <span aria-live="polite">{total.toLocaleString()} {total === 1 ? 'fabric' : 'fabrics'} found</span>
                )}
              </p>

              <select
                aria-label="sort fabrics"
                value={filters.sort}
                onChange={(e) => handleSort(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            {/* Error */}
            {error && (
              <div role="alert" className="mb-6 px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {isLoading
                ? Array.from({ length: SKELETON_COUNT }).map((_, i) => (
                    <FabricCardSkeleton key={i} />
                  ))
                : fabrics.map((fabric) => (
                    <FabricCard key={fabric._id} fabric={fabric} />
                  ))}
            </div>

            {/* Empty state */}
            {!isLoading && fabrics.length === 0 && !error && (
              <div className="text-center py-20">
                <p className="text-5xl mb-4">🧵</p>
                <p className="text-gray-600 font-medium">No fabrics match your filters.</p>
                <button
                  type="button"
                  onClick={handleReset}
                  className="mt-4 text-sm text-brand-600 hover:text-brand-700 font-medium"
                >
                  Clear filters
                </button>
              </div>
            )}

            {/* Pagination */}
            {!isLoading && pages > 1 && (
              <div className="mt-10 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => handlePage(currentPage - 1)}
                  disabled={currentPage <= 1}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-600">
                  Page {currentPage} of {pages}
                </span>
                <button
                  type="button"
                  onClick={() => handlePage(currentPage + 1)}
                  disabled={currentPage >= pages}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

export default FabricCatalogPage;
