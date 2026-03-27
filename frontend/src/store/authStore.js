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

  /**
   * Set auth state after a successful login or token refresh.
   * @param {{ user: object, accessToken: string }} payload
   */
  setAuth: ({ user, accessToken }) => set({ user, accessToken }),

  /**
   * Clear auth state on logout.
   */
  clearAuth: () => set({ user: null, accessToken: null }),
}));

export default useAuthStore;
