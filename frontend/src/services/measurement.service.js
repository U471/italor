import api from './api';

export const saveProfile = (payload) => api.post('/api/v1/measurements', payload);
export const getProfiles = () => api.get('/api/v1/measurements');
export const updateProfile = (id, payload) => api.put(`/api/v1/measurements/${id}`, payload);
export const deleteProfile = (id) => api.delete(`/api/v1/measurements/${id}`);
