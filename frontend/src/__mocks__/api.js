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
export default api;
