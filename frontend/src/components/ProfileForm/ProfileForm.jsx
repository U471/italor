import { useState } from 'react';
import { updateMe } from '../../services/api';
import useAuthStore from '../../store/authStore';

/**
 * ProfileForm — lets the user update firstName, lastName, and phone.
 * On success: updates the Zustand store and shows a success message.
 */
function ProfileForm() {
  const { user, setAuth, accessToken } = useAuthStore((s) => ({
    user: s.user,
    setAuth: s.setAuth,
    accessToken: s.accessToken,
  }));

  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [phone, setPhone] = useState(user?.phone || '');

  const [isLoading, setIsLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');
    setIsLoading(true);

    try {
      const result = await updateMe({ firstName, lastName, phone });
      setAuth({ user: result.user, accessToken });
      setSuccessMsg('Profile updated successfully.');
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update profile.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form aria-label="profile form" onSubmit={handleSubmit} className="space-y-5">
      <h2 className="text-lg font-semibold text-gray-900">Personal Information</h2>

      {successMsg && (
        <div role="status" className="px-4 py-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div role="alert" className="px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {errorMsg}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
            First name
          </label>
          <input
            id="firstName"
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
            className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent text-sm"
          />
        </div>
        <div>
          <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
            Last name
          </label>
          <input
            id="lastName"
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
            className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent text-sm"
          />
        </div>
      </div>

      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
          Phone number
        </label>
        <input
          id="phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+1 234 567 8900"
          className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Email address</label>
        <p className="px-3 py-2.5 text-sm text-gray-500 bg-gray-50 border border-gray-200 rounded-lg">
          {user?.email}
        </p>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-3 px-4 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? 'Saving…' : 'Save changes'}
      </button>
    </form>
  );
}

export default ProfileForm;
