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
export default api;
