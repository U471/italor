import { useEffect, useState } from 'react';
import { getProfiles, updateProfile, deleteProfile } from '../services/measurement.service';

/**
 * My Account > My Measurements page.
 * Lists saved measurement profiles with Set as Default, Edit name, Delete.
 */
const MyMeasurementsPage = () => {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [settingDefaultId, setSettingDefaultId] = useState(null);

  useEffect(() => {
    getProfiles()
      .then((res) => setProfiles(res.data.data.profiles))
      .catch(() => setProfiles([]))
      .finally(() => setLoading(false));
  }, []);

  const handleSetDefault = async (id) => {
    setSettingDefaultId(id);
    try {
      await updateProfile(id, { isDefault: true });
      setProfiles((prev) => prev.map((p) => ({ ...p, isDefault: p._id === id })));
    } finally {
      setSettingDefaultId(null);
    }
  };

  const handleEditSave = async (id) => {
    try {
      const updated = await updateProfile(id, { name: editName });
      setProfiles((prev) => prev.map((p) => (p._id === id ? updated.data.data.profile : p)));
      setEditingId(null);
    } catch { /* noop */ }
  };

  const handleDelete = async (id) => {
    setDeletingId(id);
    try {
      await deleteProfile(id);
      setProfiles((prev) => prev.filter((p) => p._id !== id));
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
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">My Measurements</h1>
      <p className="text-sm text-gray-500 mb-8">{profiles.length}/5 saved profiles</p>

      {profiles.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-xl">
          <p className="text-gray-500">No measurement profiles saved yet.</p>
          <p className="text-sm text-gray-400 mt-1">Complete the measurement step in the suit configurator to save a profile.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {profiles.map((profile) => (
            <div key={profile._id} className="bg-white border border-gray-200 rounded-xl p-5 flex items-start justify-between gap-4">
              <div className="flex-1">
                {editingId === profile._id ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button type="button" onClick={() => handleEditSave(profile._id)} className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg">Save</button>
                    <button type="button" onClick={() => setEditingId(null)} className="text-xs text-gray-500 hover:text-gray-700">Cancel</button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-gray-900">{profile.name}</p>
                    {profile.isDefault && (
                      <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium">Default</span>
                    )}
                  </div>
                )}
                <p className="text-xs text-gray-400 mt-1">
                  {profile.measurements?.fitPreference && (
                    <span className="capitalize">{profile.measurements.fitPreference} fit · </span>
                  )}
                  Saved {new Date(profile.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {!profile.isDefault && (
                  <button
                    type="button"
                    onClick={() => handleSetDefault(profile._id)}
                    disabled={settingDefaultId === profile._id}
                    className="text-xs border border-gray-300 text-gray-600 px-3 py-1.5 rounded-lg hover:border-indigo-400 hover:text-indigo-600 disabled:opacity-50"
                  >
                    {settingDefaultId === profile._id ? '...' : 'Set Default'}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => { setEditingId(profile._id); setEditName(profile.name); }}
                  className="text-xs border border-gray-300 text-gray-600 px-3 py-1.5 rounded-lg hover:border-gray-400"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(profile._id)}
                  disabled={deletingId === profile._id}
                  className="text-xs border border-red-200 text-red-500 px-3 py-1.5 rounded-lg hover:bg-red-50 disabled:opacity-50"
                >
                  {deletingId === profile._id ? '...' : 'Delete'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyMeasurementsPage;
