import { create } from 'zustand';

/**
 * Zustand auth store.
 *
 * Holds the authenticated user and the in-memory access token.
 * The access token is stored in memory only — never in localStorage.
 */
const useAuthStore = create((set) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: false,

  /**
   * Set auth state after a successful login or token refresh.
   * @param {{ user: object, accessToken: string }} payload
   */
  setAuth: ({ user, accessToken }) => set({ user, accessToken, isAuthenticated: true }),

  /**
   * Clear auth state on logout.
   */
  clearAuth: () => set({ user: null, accessToken: null, isAuthenticated: false }),

  /**
   * Set loading state.
   * @param {boolean} loading
   */
  setLoading: (loading) => set({ isLoading: loading }),
}));

export default useAuthStore;
