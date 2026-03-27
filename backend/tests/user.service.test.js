'use strict';

/**
 * Unit tests for user.service.js.
 * Mocks User model and cloudinary to stay purely in-memory.
 */

const bcrypt = require('bcryptjs');

// ── Mock upload.middleware (cloudinary) ──────────────────────────────────────
const mockDestroy = jest.fn();
jest.mock('../src/middleware/upload.middleware', () => ({
  cloudinary: { uploader: { destroy: mockDestroy } },
  uploadAvatar: {},
}));

// ── Mock User model ──────────────────────────────────────────────────────────
const mockSave = jest.fn();
const mockUser = {
  _id: 'user-id-123',
  firstName: 'Jane',
  lastName: 'Doe',
  email: 'jane@example.com',
  phone: null,
  avatarUrl: null,
  avatarPublicId: null,
  passwordHash: null,
  save: mockSave,
};

jest.mock('../src/models/User', () => ({
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn(),
}));

const User = require('../src/models/User');
const { getUserProfile, updateUserProfile, changePassword, updateAvatar } = require('../src/services/user.service');

beforeEach(() => {
  jest.clearAllMocks();
  mockSave.mockResolvedValue();
});

// ─────────────────────────────────────────────────────────────────────────────
describe('getUserProfile', () => {
  it('returns the user when found', async () => {
    User.findById.mockResolvedValue(mockUser);
    const user = await getUserProfile('user-id-123');
    expect(user).toBe(mockUser);
  });

  it('throws 404 when user not found', async () => {
    User.findById.mockResolvedValue(null);
    await expect(getUserProfile('bad-id')).rejects.toMatchObject({ statusCode: 404 });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('updateUserProfile', () => {
  it('returns updated user', async () => {
    const updated = { ...mockUser, firstName: 'Janet' };
    User.findByIdAndUpdate.mockResolvedValue(updated);

    const result = await updateUserProfile('user-id-123', { firstName: 'Janet' });
    expect(result.firstName).toBe('Janet');
    expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
      'user-id-123',
      { firstName: 'Janet' },
      { new: true, runValidators: true }
    );
  });

  it('only passes allowed fields', async () => {
    User.findByIdAndUpdate.mockResolvedValue(mockUser);
    await updateUserProfile('user-id-123', { firstName: 'A', email: 'hack@hack.com' });

    const callArgs = User.findByIdAndUpdate.mock.calls[0][1];
    expect(callArgs).not.toHaveProperty('email');
    expect(callArgs).toHaveProperty('firstName', 'A');
  });

  it('throws 404 when user not found', async () => {
    User.findByIdAndUpdate.mockResolvedValue(null);
    await expect(updateUserProfile('bad-id', {})).rejects.toMatchObject({ statusCode: 404 });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('changePassword', () => {
  it('updates passwordHash on correct current password', async () => {
    const hash = await bcrypt.hash('OldPass1', 1);
    const userWithHash = { ...mockUser, passwordHash: hash, save: mockSave };
    User.findById.mockReturnValue({ select: jest.fn().mockResolvedValue(userWithHash) });

    await changePassword('user-id-123', 'OldPass1', 'NewPass1');

    expect(mockSave).toHaveBeenCalled();
    const isNew = await bcrypt.compare('NewPass1', userWithHash.passwordHash);
    expect(isNew).toBe(true);
  });

  it('throws 400 when current password is wrong', async () => {
    const hash = await bcrypt.hash('OldPass1', 1);
    const userWithHash = { ...mockUser, passwordHash: hash, save: mockSave };
    User.findById.mockReturnValue({ select: jest.fn().mockResolvedValue(userWithHash) });

    await expect(changePassword('user-id-123', 'WrongPass', 'NewPass1')).rejects.toMatchObject({
      statusCode: 400,
      message: 'Current password is incorrect',
    });
  });

  it('throws 404 when user not found', async () => {
    User.findById.mockReturnValue({ select: jest.fn().mockResolvedValue(null) });
    await expect(changePassword('bad-id', 'x', 'y')).rejects.toMatchObject({ statusCode: 404 });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('updateAvatar', () => {
  it('updates avatarUrl and destroys old Cloudinary asset', async () => {
    const userWithAvatar = { ...mockUser, avatarPublicId: 'old-public-id', save: mockSave };
    User.findById.mockReturnValue({ select: jest.fn().mockResolvedValue(userWithAvatar) });
    mockDestroy.mockResolvedValue({ result: 'ok' });

    await updateAvatar('user-id-123', { url: 'https://new.jpg', publicId: 'new-id' });

    expect(mockDestroy).toHaveBeenCalledWith('old-public-id');
    expect(userWithAvatar.avatarUrl).toBe('https://new.jpg');
    expect(userWithAvatar.avatarPublicId).toBe('new-id');
    expect(mockSave).toHaveBeenCalled();
  });

  it('skips destroy when no previous avatar', async () => {
    const userNoAvatar = { ...mockUser, avatarPublicId: null, save: mockSave };
    User.findById.mockReturnValue({ select: jest.fn().mockResolvedValue(userNoAvatar) });

    await updateAvatar('user-id-123', { url: 'https://new.jpg', publicId: 'new-id' });

    expect(mockDestroy).not.toHaveBeenCalled();
  });

  it('continues when cloudinary destroy fails', async () => {
    const userWithAvatar = { ...mockUser, avatarPublicId: 'old', save: mockSave };
    User.findById.mockReturnValue({ select: jest.fn().mockResolvedValue(userWithAvatar) });
    mockDestroy.mockRejectedValue(new Error('CDN error'));

    await expect(updateAvatar('user-id-123', { url: 'https://new.jpg', publicId: 'new-id' })).resolves.not.toThrow();
    expect(mockSave).toHaveBeenCalled();
  });

  it('throws 404 when user not found', async () => {
    User.findById.mockReturnValue({ select: jest.fn().mockResolvedValue(null) });
    await expect(updateAvatar('bad-id', { url: '', publicId: '' })).rejects.toMatchObject({ statusCode: 404 });
  });
});
