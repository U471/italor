jest.mock('./api', () => ({
  post: jest.fn(),
  get: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
}));

import api from './api';
import {
  saveProfile,
  getProfiles,
  updateProfile,
  deleteProfile,
} from './measurement.service';

beforeEach(() => jest.clearAllMocks());

describe('measurement.service', () => {
  it('saveProfile calls api.post with correct path', () => {
    const payload = { name: 'Test', measurements: {} };
    saveProfile(payload);
    expect(api.post).toHaveBeenCalledWith('/api/v1/measurements', payload);
  });

  it('getProfiles calls api.get with correct path', () => {
    getProfiles();
    expect(api.get).toHaveBeenCalledWith('/api/v1/measurements');
  });

  it('updateProfile calls api.put with correct path and payload', () => {
    const payload = { name: 'Updated' };
    updateProfile('abc123', payload);
    expect(api.put).toHaveBeenCalledWith('/api/v1/measurements/abc123', payload);
  });

  it('deleteProfile calls api.delete with correct path', () => {
    deleteProfile('abc123');
    expect(api.delete).toHaveBeenCalledWith('/api/v1/measurements/abc123');
  });
});
