import { useState } from 'react';
import { saveDesign } from '../../services/design.service';
import useSuitStore from '../../store/suitStore';
import useAuthStore from '../../store/authStore';

/**
 * Save Design button for the suit builder header.
 * Authenticated users save to DB; guests see a sign-in prompt.
 */
const SaveDesignButton = () => {
  const { config } = useSuitStore();
  const { accessToken } = useAuthStore();
  const isAuthenticated = Boolean(accessToken);
  const [status, setStatus] = useState('idle'); // 'idle' | 'saving' | 'saved' | 'error'

  const handleSave = async () => {
    if (!isAuthenticated) {
      setStatus('error');
      setTimeout(() => setStatus('idle'), 3000);
      return;
    }
    setStatus('saving');
    try {
      await saveDesign({ suitConfig: config, name: '' });
      setStatus('saved');
      setTimeout(() => setStatus('idle'), 3000);
    } catch {
      setStatus('error');
      setTimeout(() => setStatus('idle'), 3000);
    }
  };

  const buttonClass = `flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
    status === 'saved'
      ? 'bg-green-600 text-white'
      : status === 'error'
      ? 'bg-red-50 text-red-600 border border-red-200'
      : 'bg-white border border-gray-300 text-gray-700 hover:border-gray-400'
  }`;

  let label;
  if (status === 'saved') {
    label = 'Design Saved to your account';
  } else if (status === 'error' && !isAuthenticated) {
    label = 'Sign in to save';
  } else if (status === 'error') {
    label = 'Save failed';
  } else {
    label = 'Save Design';
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleSave}
        disabled={status === 'saving'}
        className={buttonClass}
      >
        {status === 'saving' && (
          <span className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
        )}
        {label}
      </button>
    </div>
  );
};

export default SaveDesignButton;
