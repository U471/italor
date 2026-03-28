const api = {
  interceptors: {
    request: { use: jest.fn() },
    response: { use: jest.fn() },
  },
  post: jest.fn(),
  get: jest.fn(),
  put: jest.fn(),
  patch: jest.fn(),
  delete: jest.fn(),
};

export const registerUser = jest.fn();
export const loginUser = jest.fn();
export const refreshToken = jest.fn();
export const logout = jest.fn();
export const forgotPassword = jest.fn();
export const resetPassword = jest.fn();
export const getMe = jest.fn();
export const updateMe = jest.fn();
export const updatePassword = jest.fn();
export const updateAvatar = jest.fn();
export const getFabrics = jest.fn();
export const getFabricFilters = jest.fn();
export const getFabricById = jest.fn();
export const getFabricReviews = jest.fn();
export const adminGetFabrics = jest.fn();
export const adminCreateFabric = jest.fn();
export const adminUpdateFabric = jest.fn();
export const adminDeleteFabric = jest.fn();
export const adminUploadFabricImage = jest.fn();
export const adminRemoveFabricImage = jest.fn();
export default api;
