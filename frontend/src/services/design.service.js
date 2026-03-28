import api from './api';

/**
 * Saves a new design snapshot for the authenticated user.
 *
 * @param {{ suitConfig: object, name?: string, previewImageUrl?: string }} payload
 */
export const saveDesign = (payload) => api.post('/api/v1/saved-designs', payload);

/**
 * Lists all saved designs for the authenticated user.
 */
export const getDesigns = () => api.get('/api/v1/saved-designs');

/**
 * Returns a single saved design by id.
 *
 * @param {string} id
 */
export const getDesignById = (id) => api.get(`/api/v1/saved-designs/${id}`);

/**
 * Deletes a saved design by id.
 *
 * @param {string} id
 */
export const deleteDesign = (id) => api.delete(`/api/v1/saved-designs/${id}`);
