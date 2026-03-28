import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../services/api';

const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) { setStatus('error'); setMessage('No verification token provided.'); return; }
    api.get(`/auth/verify-email?token=${token}`)
      .then(() => { setStatus('success'); setMessage('Your email has been verified!'); setTimeout(() => navigate('/'), 3000); })
      .catch((err) => { setStatus('error'); setMessage(err.response?.data?.message || 'Invalid or expired token.'); });
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
        {status === 'loading' && <><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4" /><p className="text-gray-600">Verifying your email...</p></>}
        {status === 'success' && <><div className="text-green-500 text-5xl mb-4">✓</div><h2 className="text-2xl font-bold text-gray-900 mb-2">Email Verified!</h2><p className="text-gray-600">{message}</p><p className="text-sm text-gray-400 mt-2">Redirecting...</p></>}
        {status === 'error' && <><div className="text-red-500 text-5xl mb-4">✗</div><h2 className="text-2xl font-bold text-gray-900 mb-2">Verification Failed</h2><p className="text-gray-600">{message}</p><button onClick={() => navigate('/login')} className="mt-4 bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700">Go to Login</button></>}
      </div>
    </div>
  );
};
export default VerifyEmailPage;
