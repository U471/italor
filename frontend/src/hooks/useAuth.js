import { useEffect, useState } from 'react';
import { refreshToken as refreshTokenApi, logout as logoutApi } from '../services/api';
import useAuthStore from '../store/authStore';

/**
 * useAuth hook.
 *
 * - On mount: attempts a silent token refresh to restore session from cookie.
 * - Returns auth state and helpers for login/logout.
 *
 * @returns {{
 *   user: object|null,
 *   accessToken: string|null,
 *   isAuthenticated: boolean,
 *   isLoading: boolean,
 *   login: (user: object, accessToken: string) => void,
 *   logout: () => Promise<void>
 * }}
 */
function useAuth() {
  const { user, accessToken, setAuth, clearAuth } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Skip refresh attempt if already authenticated (e.g., just logged in)
    if (accessToken) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    async function tryRefresh() {
      try {
        const data = await refreshTokenApi();
        if (!cancelled) {
          // Restore user from refreshed access token
          // The API returns accessToken; user data comes from the token payload
          // We store what we have — user may be null until /user/me is called
          setAuth({ user: data.user || null, accessToken: data.accessToken });
        }
      } catch {
        // No valid refresh token — user stays unauthenticated
        if (!cancelled) {
          clearAuth();
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    tryRefresh();

    return () => {
      cancelled = true;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- intentional: run once on mount to restore session

  function login(userData, token) {
    setAuth({ user: userData, accessToken: token });
  }

  async function logout() {
    try {
      await logoutApi();
    } catch {
      // Even if logout API fails, clear local state
    } finally {
      clearAuth();
    }
  }

  return {
    user,
    accessToken,
    isAuthenticated: Boolean(accessToken),
    isLoading,
    login,
    logout,
  };
}

export default useAuth;
