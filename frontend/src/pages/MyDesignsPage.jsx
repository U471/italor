import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDesigns, deleteDesign } from '../services/design.service';
import useSuitStore from '../store/suitStore';

/**
 * My Account > My Designs page.
 * Lists saved design snapshots with thumbnail, name, date.
 * "Continue Designing" restores the config into suitStore and navigates to /builder.
 */
const MyDesignsPage = () => {
  const navigate = useNavigate();
  const { loadConfig } = useSuitStore();
  const [designs, setDesigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    getDesigns()
      .then((res) => setDesigns(res.data.data.designs))
      .catch(() => setDesigns([]))
      .finally(() => setLoading(false));
  }, []);

  const handleContinue = (design) => {
    loadConfig(design.suitConfig);
    navigate('/builder');
  };

  const handleDelete = async (id) => {
    setDeletingId(id);
    try {
      await deleteDesign(id);
      setDesigns((prev) => prev.filter((d) => d._id !== id));
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">My Designs</h1>
      <p className="text-sm text-gray-500 mb-8">{designs.length}/10 saved designs</p>

      {designs.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-xl">
          <p className="text-gray-500 text-lg mb-4">No saved designs yet.</p>
          <button
            type="button"
            onClick={() => navigate('/builder')}
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 text-sm font-medium"
          >
            Start Designing
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {designs.map((design) => (
            <div
              key={design._id}
              className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
            >
              {/* Thumbnail */}
              <div className="h-40 bg-gray-900 flex items-center justify-center">
                {design.previewImageUrl ? (
                  <img
                    src={design.previewImageUrl}
                    alt={design.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <svg viewBox="0 0 60 80" className="w-16 h-20">
                    <path
                      d="M12 8 L8 25 L7 72 L53 72 L52 25 L48 8 L36 14 L30 11 L24 14 Z"
                      fill="#374151"
                    />
                    <rect x="26" y="10" width="8" height="3" rx="1" fill="#6B7280" />
                  </svg>
                )}
              </div>

              <div className="p-4">
                <p className="font-semibold text-gray-900 text-sm truncate">
                  {design.name || 'Untitled Design'}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(design.createdAt).toLocaleDateString('en-US', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </p>
                <div className="flex gap-2 mt-3">
                  <button
                    type="button"
                    onClick={() => handleContinue(design)}
                    className="flex-1 bg-indigo-600 text-white text-xs font-medium py-2 rounded-lg hover:bg-indigo-700"
                  >
                    Continue Designing
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(design._id)}
                    disabled={deletingId === design._id}
                    className="px-3 py-2 rounded-lg border border-red-200 text-red-500 text-xs hover:bg-red-50 disabled:opacity-50"
                  >
                    {deletingId === design._id ? '...' : 'Delete'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyDesignsPage;
