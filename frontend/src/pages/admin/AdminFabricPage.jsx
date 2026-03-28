import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  adminGetFabrics,
  adminCreateFabric,
  adminUpdateFabric,
  adminDeleteFabric,
  adminUploadFabricImage,
  adminRemoveFabricImage,
} from '../../services/api';
import AdminFabricForm from '../../components/AdminFabricForm/AdminFabricForm';

/**
 * AdminFabricPage — /admin/fabrics
 *
 * Admin-only page for managing the fabric catalog:
 *  - Paginated table of all fabrics (active + inactive)
 *  - Create new fabric (modal form)
 *  - Edit existing fabric (modal form)
 *  - Soft-delete (deactivate) fabric
 *  - Upload / remove fabric images
 */
function AdminFabricPage() {
  const [fabrics, setFabrics] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [listError, setListError] = useState('');

  // Modal state
  const [modal, setModal] = useState(null); // null | 'create' | { fabric }
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  // Image upload
  const [uploadTarget, setUploadTarget] = useState(null); // fabric being image-managed
  const [uploadError, setUploadError] = useState('');
  const [uploadLoading, setUploadLoading] = useState(false);
  const fileInputRef = useRef(null);

  function loadFabrics(p = 1) {
    setIsLoading(true);
    setListError('');
    adminGetFabrics({ page: p, limit: 20 })
      .then(({ fabrics: f, total: t, pages: pg }) => {
        setFabrics(f);
        setTotal(t);
        setPages(pg);
        setPage(p);
      })
      .catch(() => setListError('Failed to load fabrics.'))
      .finally(() => setIsLoading(false));
  }

  useEffect(() => { loadFabrics(1); }, []);

  async function handleCreate(values) {
    setFormLoading(true);
    setFormError('');
    try {
      await adminCreateFabric(values);
      setModal(null);
      loadFabrics(page);
    } catch (err) {
      setFormError(err.message || 'Failed to create fabric.');
    } finally {
      setFormLoading(false);
    }
  }

  async function handleUpdate(values) {
    setFormLoading(true);
    setFormError('');
    try {
      await adminUpdateFabric(modal.fabric._id, values);
      setModal(null);
      loadFabrics(page);
    } catch (err) {
      setFormError(err.message || 'Failed to update fabric.');
    } finally {
      setFormLoading(false);
    }
  }

  async function handleDelete(fabric) {
    if (!window.confirm(`Deactivate "${fabric.name}"? It will be hidden from the catalog.`)) { return; }
    try {
      await adminDeleteFabric(fabric._id);
      loadFabrics(page);
    } catch (_err) {
      setListError('Failed to deactivate fabric.');
    }
  }

  async function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file || !uploadTarget) { return; }
    const formData = new FormData();
    formData.append('image', file);
    setUploadLoading(true);
    setUploadError('');
    try {
      await adminUploadFabricImage(uploadTarget._id, formData);
      loadFabrics(page);
      setUploadTarget(null);
    } catch (_err) {
      setUploadError('Failed to upload image.');
    } finally {
      setUploadLoading(false);
    }
  }

  async function handleRemoveImage(fabricId, imageUrl) {
    setUploadLoading(true);
    setUploadError('');
    try {
      await adminRemoveFabricImage(fabricId, imageUrl);
      loadFabrics(page);
    } catch (_err) {
      setUploadError('Failed to remove image.');
    } finally {
      setUploadLoading(false);
    }
  }

  function openModal(type, fabric = null) {
    setFormError('');
    setModal(fabric ? { fabric } : type);
  }

  const isEditModal = modal && typeof modal === 'object' && modal.fabric;
  const isCreateModal = modal === 'create';

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div>
            <Link to="/" className="text-xl font-serif font-bold text-gray-900 hover:text-brand-700">
              iTailor
            </Link>
            <span className="ml-2 text-sm text-gray-400">/ Admin</span>
          </div>
          <button
            type="button"
            onClick={() => openModal('create')}
            className="px-4 py-2 bg-gray-900 text-white text-sm font-semibold rounded-lg hover:bg-gray-800 transition-colors"
          >
            + New Fabric
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-serif font-bold text-gray-900">
            Fabric Management
            {!isLoading && <span className="text-base font-normal text-gray-400 ml-2">({total} total)</span>}
          </h1>
        </div>

        {listError && (
          <div role="alert" className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {listError}
          </div>
        )}

        {/* Table */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Fabric</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 hidden sm:table-cell">Material</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 hidden md:table-cell">Price</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 hidden lg:table-cell">Stock</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Status</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-gray-100 animate-pulse">
                    <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-40" /></td>
                    <td className="px-4 py-3 hidden sm:table-cell"><div className="h-4 bg-gray-200 rounded w-16" /></td>
                    <td className="px-4 py-3 hidden md:table-cell"><div className="h-4 bg-gray-200 rounded w-12" /></td>
                    <td className="px-4 py-3 hidden lg:table-cell"><div className="h-4 bg-gray-200 rounded w-10" /></td>
                    <td className="px-4 py-3"><div className="h-5 bg-gray-200 rounded-full w-16" /></td>
                    <td className="px-4 py-3" />
                  </tr>
                ))
              )}
              {!isLoading && fabrics.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-gray-400">
                    No fabrics found. Create one to get started.
                  </td>
                </tr>
              )}
              {!isLoading && fabrics.map((fabric) => (
                <tr key={fabric._id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden">
                        {fabric.thumbnailUrl
                          ? <img src={fabric.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                          : <span className="w-full h-full flex items-center justify-center text-sm">🧵</span>}
                      </div>
                      <span className="font-medium text-gray-900 truncate max-w-[160px]">{fabric.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell capitalize text-gray-600">{fabric.material}</td>
                  <td className="px-4 py-3 hidden md:table-cell text-gray-600">£{fabric.price}</td>
                  <td className="px-4 py-3 hidden lg:table-cell text-gray-600">{fabric.stock ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      fabric.isActive
                        ? 'bg-green-50 text-green-700'
                        : 'bg-gray-100 text-gray-500'
                    }`}>
                      {fabric.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        aria-label={`manage images for ${fabric.name}`}
                        onClick={() => { setUploadTarget(fabric); setUploadError(''); }}
                        className="text-xs text-gray-500 hover:text-gray-800 px-2 py-1 rounded border border-gray-200 hover:border-gray-400 transition-colors"
                      >
                        Images
                      </button>
                      <button
                        type="button"
                        aria-label={`edit ${fabric.name}`}
                        onClick={() => openModal('edit', fabric)}
                        className="text-xs text-blue-600 hover:text-blue-800 px-2 py-1 rounded border border-blue-200 hover:border-blue-400 transition-colors"
                      >
                        Edit
                      </button>
                      {fabric.isActive && (
                        <button
                          type="button"
                          aria-label={`deactivate ${fabric.name}`}
                          onClick={() => handleDelete(fabric)}
                          className="text-xs text-red-500 hover:text-red-700 px-2 py-1 rounded border border-red-200 hover:border-red-400 transition-colors"
                        >
                          Deactivate
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div className="mt-6 flex items-center justify-center gap-3">
            <button
              type="button" onClick={() => loadFabrics(page - 1)} disabled={page <= 1}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-sm text-gray-600">Page {page} of {pages}</span>
            <button
              type="button" onClick={() => loadFabrics(page + 1)} disabled={page >= pages}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Create / Edit modal */}
      {(isCreateModal || isEditModal) && (
        <Modal
          title={isEditModal ? `Edit — ${modal.fabric.name}` : 'New Fabric'}
          onClose={() => setModal(null)}
        >
          <AdminFabricForm
            initialValues={isEditModal ? modal.fabric : undefined}
            onSubmit={isEditModal ? handleUpdate : handleCreate}
            onCancel={() => setModal(null)}
            isLoading={formLoading}
            error={formError}
          />
        </Modal>
      )}

      {/* Image management modal */}
      {uploadTarget && (
        <Modal title={`Images — ${uploadTarget.name}`} onClose={() => setUploadTarget(null)}>
          <div className="space-y-4">
            {uploadError && (
              <div role="alert" className="px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                {uploadError}
              </div>
            )}

            {/* Current images */}
            {uploadTarget.images && uploadTarget.images.length > 0 ? (
              <div className="grid grid-cols-3 gap-3">
                {uploadTarget.images.map((img, i) => (
                  <div key={i} className="relative group">
                    <img src={img} alt={`Fabric ${i + 1}`} className="w-full aspect-square object-cover rounded-lg border border-gray-200" />
                    <button
                      type="button"
                      aria-label={`remove image ${i + 1}`}
                      onClick={() => handleRemoveImage(uploadTarget._id, img)}
                      disabled={uploadLoading}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 text-center py-4">No images yet.</p>
            )}

            {/* Upload new */}
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                aria-label="upload fabric image"
                className="hidden"
                onChange={handleImageUpload}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current && fileInputRef.current.click()}
                disabled={uploadLoading}
                className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-sm text-gray-500 hover:border-gray-400 hover:text-gray-700 disabled:opacity-50 transition-colors"
              >
                {uploadLoading ? 'Uploading…' : '+ Upload Image (JPG / PNG / WebP, max 5 MB)'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </main>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <button
            type="button" onClick={onClose} aria-label="close modal"
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
          >
            ×
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

export default AdminFabricPage;
