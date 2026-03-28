'use strict';

/**
 * Unit tests for admin.fabric.service.js.
 * Mocks the Fabric model and cloudinary to stay in-memory.
 */

const mockDestroy = jest.fn();

jest.mock('../src/middleware/upload.middleware', () => ({
  cloudinary: {
    uploader: { destroy: mockDestroy },
  },
}));

// Fabric instance returned by findById
function makeFabricDoc(data) {
  const doc = {
    ...data,
    images: data.images ? [...data.images] : [],
    thumbnailUrl: data.thumbnailUrl || null,
    imageUrl: data.imageUrl || null,
    save: jest.fn().mockResolvedValue(undefined),
    toObject: jest.fn(() => ({ ...doc })),
  };
  return doc;
}

const mockFindById = jest.fn();
const mockFindByIdAndUpdateLean = jest.fn();
const mockCreate = jest.fn();
const mockFind = jest.fn();
const mockCountDocuments = jest.fn();

// findByIdAndUpdate returns a chainable object with .lean()
const mockFindByIdAndUpdate = jest.fn(() => ({
  lean: mockFindByIdAndUpdateLean,
}));

jest.mock('../src/models/Fabric', () => ({
  find: jest.fn(() => ({
    sort: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    lean: mockFind,
  })),
  countDocuments: mockCountDocuments,
  create: mockCreate,
  findById: mockFindById,
  findByIdAndUpdate: mockFindByIdAndUpdate,
}));

const {
  adminListFabrics,
  adminCreateFabric,
  adminUpdateFabric,
  adminDeleteFabric,
  adminAddFabricImage,
  adminRemoveFabricImage,
} = require('../src/services/admin.fabric.service');

const SAMPLE_FABRIC = {
  _id: 'f1',
  name: 'Italian Merino Wool',
  material: 'wool',
  color: 'navy',
  pattern: 'solid',
  price: 320,
  stock: 50,
  isActive: true,
  images: [],
  thumbnailUrl: null,
  imageUrl: null,
};

beforeEach(() => jest.clearAllMocks());

// ─────────────────────────────────────────────────────────────────────────────
describe('adminListFabrics', () => {
  it('returns paginated fabrics with total and page info', async () => {
    mockFind.mockResolvedValue([SAMPLE_FABRIC]);
    mockCountDocuments.mockResolvedValue(1);

    const result = await adminListFabrics({ page: 1, limit: 20 });

    expect(result.fabrics).toHaveLength(1);
    expect(result.total).toBe(1);
    expect(result.page).toBe(1);
    expect(result.pages).toBe(1);
  });

  it('clamps limit to 100 and page to minimum 1', async () => {
    mockFind.mockResolvedValue([]);
    mockCountDocuments.mockResolvedValue(0);

    const result = await adminListFabrics({ page: -5, limit: 999 });

    expect(result.page).toBe(1);
  });

  it('defaults to page 1 and limit 20 when not provided', async () => {
    mockFind.mockResolvedValue([]);
    mockCountDocuments.mockResolvedValue(0);

    const result = await adminListFabrics();

    expect(result.page).toBe(1);
  });

  it('calculates pages correctly', async () => {
    mockFind.mockResolvedValue([]);
    mockCountDocuments.mockResolvedValue(45);

    const result = await adminListFabrics({ page: 1, limit: 20 });

    expect(result.pages).toBe(3);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('adminCreateFabric', () => {
  it('creates and returns a fabric with allowed fields only', async () => {
    const created = { ...SAMPLE_FABRIC, toObject: () => SAMPLE_FABRIC };
    mockCreate.mockResolvedValue(created);

    const result = await adminCreateFabric({
      name: 'Italian Merino Wool',
      material: 'wool',
      color: 'navy',
      pattern: 'solid',
      price: 320,
      _nonAllowed: 'ignored',
    });

    expect(mockCreate).toHaveBeenCalledWith(
      expect.not.objectContaining({ _nonAllowed: 'ignored' })
    );
    expect(result.name).toBe('Italian Merino Wool');
  });

  it('ignores undefined fields and only passes defined allowed fields', async () => {
    const created = { ...SAMPLE_FABRIC, toObject: () => SAMPLE_FABRIC };
    mockCreate.mockResolvedValue(created);

    await adminCreateFabric({ name: 'Test', price: undefined, color: 'blue' });

    const callArg = mockCreate.mock.calls[0][0];
    expect(callArg).toHaveProperty('name', 'Test');
    expect(callArg).toHaveProperty('color', 'blue');
    expect(callArg).not.toHaveProperty('price');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('adminUpdateFabric', () => {
  it('returns updated fabric', async () => {
    const updated = { ...SAMPLE_FABRIC, price: 400 };
    mockFindByIdAndUpdateLean.mockResolvedValue(updated);

    const result = await adminUpdateFabric('f1', { price: 400 });

    expect(result.price).toBe(400);
  });

  it('returns null when fabric not found', async () => {
    mockFindByIdAndUpdateLean.mockResolvedValue(null);

    const result = await adminUpdateFabric('nonexistent', { price: 100 });

    expect(result).toBeNull();
  });

  it('calls findByIdAndUpdate with $set and runValidators', async () => {
    mockFindByIdAndUpdateLean.mockResolvedValue(SAMPLE_FABRIC);

    await adminUpdateFabric('f1', { price: 250 });

    expect(mockFindByIdAndUpdate).toHaveBeenCalledWith(
      'f1',
      { $set: { price: 250 } },
      { new: true, runValidators: true }
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('adminDeleteFabric', () => {
  it('soft-deletes by setting isActive false', async () => {
    const deactivated = { ...SAMPLE_FABRIC, isActive: false };
    mockFindByIdAndUpdateLean.mockResolvedValue(deactivated);

    const result = await adminDeleteFabric('f1');

    expect(mockFindByIdAndUpdate).toHaveBeenCalledWith(
      'f1',
      { $set: { isActive: false } },
      { new: true }
    );
    expect(result.isActive).toBe(false);
  });

  it('returns null when fabric not found', async () => {
    mockFindByIdAndUpdateLean.mockResolvedValue(null);

    const result = await adminDeleteFabric('nonexistent');

    expect(result).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('adminAddFabricImage', () => {
  it('returns null when fabric not found', async () => {
    mockFindById.mockResolvedValue(null);

    const result = await adminAddFabricImage('nonexistent', 'https://img.url/1.jpg', 'pub1');

    expect(result).toBeNull();
  });

  it('pushes image URL into images array', async () => {
    const doc = makeFabricDoc({ ...SAMPLE_FABRIC, images: [] });
    mockFindById.mockResolvedValue(doc);

    await adminAddFabricImage('f1', 'https://img.url/1.jpg', 'pub1');

    expect(doc.images).toContain('https://img.url/1.jpg');
    expect(doc.save).toHaveBeenCalled();
  });

  it('sets thumbnailUrl and imageUrl when images was empty', async () => {
    const doc = makeFabricDoc({ ...SAMPLE_FABRIC, images: [], thumbnailUrl: null, imageUrl: null });
    mockFindById.mockResolvedValue(doc);

    await adminAddFabricImage('f1', 'https://img.url/1.jpg', 'pub1');

    expect(doc.thumbnailUrl).toBe('https://img.url/1.jpg');
    expect(doc.imageUrl).toBe('https://img.url/1.jpg');
  });

  it('does not overwrite existing thumbnailUrl', async () => {
    const doc = makeFabricDoc({
      ...SAMPLE_FABRIC,
      images: ['https://img.url/existing.jpg'],
      thumbnailUrl: 'https://img.url/existing.jpg',
    });
    mockFindById.mockResolvedValue(doc);

    await adminAddFabricImage('f1', 'https://img.url/new.jpg', 'pub2');

    expect(doc.thumbnailUrl).toBe('https://img.url/existing.jpg');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('adminRemoveFabricImage', () => {
  const IMAGE_URL = 'https://res.cloudinary.com/demo/image/upload/italor/fabrics/img.jpg';

  it('returns null when fabric not found', async () => {
    mockFindById.mockResolvedValue(null);

    const result = await adminRemoveFabricImage('nonexistent', IMAGE_URL);

    expect(result).toBeNull();
  });

  it('removes imageUrl from images array', async () => {
    const doc = makeFabricDoc({ ...SAMPLE_FABRIC, images: [IMAGE_URL], thumbnailUrl: 'other.jpg' });
    mockFindById.mockResolvedValue(doc);
    mockDestroy.mockResolvedValue({ result: 'ok' });

    await adminRemoveFabricImage('f1', IMAGE_URL);

    expect(doc.images).not.toContain(IMAGE_URL);
    expect(doc.save).toHaveBeenCalled();
  });

  it('updates thumbnailUrl to next image when removed url was thumbnail', async () => {
    const doc = makeFabricDoc({
      ...SAMPLE_FABRIC,
      images: [IMAGE_URL, 'https://img.url/second.jpg'],
      thumbnailUrl: IMAGE_URL,
    });
    mockFindById.mockResolvedValue(doc);
    mockDestroy.mockResolvedValue({ result: 'ok' });

    await adminRemoveFabricImage('f1', IMAGE_URL);

    expect(doc.thumbnailUrl).toBe('https://img.url/second.jpg');
    expect(doc.imageUrl).toBe('https://img.url/second.jpg');
  });

  it('sets thumbnailUrl to null when last image removed', async () => {
    const doc = makeFabricDoc({ ...SAMPLE_FABRIC, images: [IMAGE_URL], thumbnailUrl: IMAGE_URL });
    mockFindById.mockResolvedValue(doc);
    mockDestroy.mockResolvedValue({ result: 'ok' });

    await adminRemoveFabricImage('f1', IMAGE_URL);

    expect(doc.thumbnailUrl).toBeNull();
  });

  it('does not throw if cloudinary destroy fails', async () => {
    const doc = makeFabricDoc({ ...SAMPLE_FABRIC, images: [IMAGE_URL], thumbnailUrl: IMAGE_URL });
    mockFindById.mockResolvedValue(doc);
    mockDestroy.mockRejectedValue(new Error('Cloudinary error'));

    await expect(adminRemoveFabricImage('f1', IMAGE_URL)).resolves.toBeDefined();
  });
});
