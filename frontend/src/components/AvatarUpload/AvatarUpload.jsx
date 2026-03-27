import { useState, useRef } from 'react';
import { updateAvatar } from '../../services/api';
import useAuthStore from '../../store/authStore';

const MAX_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/**
 * AvatarUpload — shows the current avatar (or initials fallback) and
 * lets the user upload a new image (JPG/PNG/WebP, max 2 MB).
 */
function AvatarUpload() {
  const { user, setAuth, accessToken } = useAuthStore((s) => ({
    user: s.user,
    setAuth: s.setAuth,
    accessToken: s.accessToken,
  }));
  const [preview, setPreview] = useState(user?.avatarUrl || null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const inputRef = useRef(null);

  const initials = [user?.firstName?.[0], user?.lastName?.[0]].filter(Boolean).join('').toUpperCase();

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) { return; }

    if (!ALLOWED_TYPES.includes(file.type)) {
      setErrorMsg('Only JPG, PNG, and WebP images are allowed.');
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      setErrorMsg('Image must be smaller than 2 MB.');
      return;
    }

    setErrorMsg('');
    setSuccessMsg('');
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    handleUpload(file);
  }

  async function handleUpload(file) {
    setIsLoading(true);
    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const result = await updateAvatar(formData);
      setAuth({ user: { ...user, avatarUrl: result.avatarUrl }, accessToken });
      setSuccessMsg('Avatar updated.');
    } catch (err) {
      setErrorMsg(err.message || 'Upload failed.');
      setPreview(user?.avatarUrl || null);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Avatar display */}
      <button
        type="button"
        aria-label="upload avatar"
        onClick={() => inputRef.current?.click()}
        disabled={isLoading}
        className="relative w-24 h-24 rounded-full bg-brand-100 text-brand-700 text-2xl font-semibold flex items-center justify-center overflow-hidden border-2 border-brand-200 hover:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-colors"
      >
        {preview ? (
          <img src={preview} alt="Profile avatar" className="w-full h-full object-cover" />
        ) : (
          <span>{initials || 'U'}</span>
        )}
        {isLoading && (
          <span className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
            <svg className="animate-spin h-6 w-6 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          </span>
        )}
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileChange}
        data-testid="avatar-file-input"
      />

      <p className="text-xs text-gray-500">JPG, PNG or WebP · max 2 MB</p>

      {successMsg && (
        <p role="status" className="text-xs text-green-600">{successMsg}</p>
      )}
      {errorMsg && (
        <p role="alert" className="text-xs text-red-600">{errorMsg}</p>
      )}
    </div>
  );
}

export default AvatarUpload;
