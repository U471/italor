'use strict';

/**
 * Unit tests for fabric.service.js.
 * Mocks the Fabric model to stay in-memory.
 */

const mockFabricFind = jest.fn();
const mockFabricCount = jest.fn();
const mockFabricDistinct = jest.fn();

jest.mock('../src/models/Fabric', () => ({
  find: jest.fn(() => ({
    sort: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    lean: mockFabricFind,
  })),
  countDocuments: mockFabricCount,
  distinct: mockFabricDistinct,
}));

const { getFabrics, getFabricFilterOptions } = require('../src/services/fabric.service');

const SAMPLE_FABRICS = [
  { _id: 'f1', name: 'Italian Wool', material: 'wool', color: 'navy', pattern: 'solid', price: 320 },
  { _id: 'f2', name: 'Cotton Oxford', material: 'cotton', color: 'white', pattern: 'solid', price: 120 },
];

beforeEach(() => {
  jest.clearAllMocks();
});

// ─────────────────────────────────────────────────────────────────────────────
describe('getFabrics', () => {
  it('returns fabrics with pagination metadata', async () => {
    mockFabricFind.mockResolvedValue(SAMPLE_FABRICS);
    mockFabricCount.mockResolvedValue(2);

    const result = await getFabrics({});

    expect(result.fabrics).toHaveLength(2);
    expect(result.total).toBe(2);
    expect(result.page).toBe(1);
    expect(result.pages).toBe(1);
    expect(result.limit).toBe(24);
  });

  it('defaults to page 1 and limit 24', async () => {
    mockFabricFind.mockResolvedValue([]);
    mockFabricCount.mockResolvedValue(0);

    const result = await getFabrics({});

    expect(result.page).toBe(1);
    expect(result.limit).toBe(24);
  });

  it('clamps limit to MAX_LIMIT (100)', async () => {
    mockFabricFind.mockResolvedValue([]);
    mockFabricCount.mockResolvedValue(0);

    const result = await getFabrics({ limit: 200 });

    expect(result.limit).toBe(100);
  });

  it('calculates correct page count', async () => {
    mockFabricFind.mockResolvedValue([]);
    mockFabricCount.mockResolvedValue(50);

    const result = await getFabrics({ limit: 24 });

    expect(result.pages).toBe(3); // ceil(50/24) = 3
  });

  it('passes isActive:true filter always', async () => {
    const Fabric = require('../src/models/Fabric');
    mockFabricFind.mockResolvedValue([]);
    mockFabricCount.mockResolvedValue(0);

    await getFabrics({});

    expect(Fabric.find).toHaveBeenCalledWith(
      expect.objectContaining({ isActive: true }),
      expect.anything()
    );
  });

  it('adds material filter when provided', async () => {
    const Fabric = require('../src/models/Fabric');
    mockFabricFind.mockResolvedValue([]);
    mockFabricCount.mockResolvedValue(0);

    await getFabrics({ material: 'Wool' });

    expect(Fabric.find).toHaveBeenCalledWith(
      expect.objectContaining({ material: 'wool' }),
      expect.anything()
    );
  });

  it('adds price range filter when minPrice and maxPrice provided', async () => {
    const Fabric = require('../src/models/Fabric');
    mockFabricFind.mockResolvedValue([]);
    mockFabricCount.mockResolvedValue(0);

    await getFabrics({ minPrice: 100, maxPrice: 400 });

    expect(Fabric.find).toHaveBeenCalledWith(
      expect.objectContaining({ price: { $gte: 100, $lte: 400 } }),
      expect.anything()
    );
  });

  it('adds $text search when search param provided', async () => {
    const Fabric = require('../src/models/Fabric');
    mockFabricFind.mockResolvedValue([]);
    mockFabricCount.mockResolvedValue(0);

    await getFabrics({ search: 'italian wool' });

    expect(Fabric.find).toHaveBeenCalledWith(
      expect.objectContaining({ $text: { $search: 'italian wool' } }),
      expect.anything()
    );
  });

  it('ignores empty search string', async () => {
    const Fabric = require('../src/models/Fabric');
    mockFabricFind.mockResolvedValue([]);
    mockFabricCount.mockResolvedValue(0);

    await getFabrics({ search: '   ' });

    const callArg = Fabric.find.mock.calls[0][0];
    expect(callArg).not.toHaveProperty('$text');
  });

  it('handles page beyond available results gracefully', async () => {
    mockFabricFind.mockResolvedValue([]);
    mockFabricCount.mockResolvedValue(10);

    const result = await getFabrics({ page: 99, limit: 24 });

    expect(result.fabrics).toHaveLength(0);
    expect(result.page).toBe(99);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('getFabricFilterOptions', () => {
  it('returns distinct materials, colors, and patterns', async () => {
    mockFabricDistinct
      .mockResolvedValueOnce(['wool', 'cotton', 'linen'])
      .mockResolvedValueOnce(['navy', 'white'])
      .mockResolvedValueOnce(['solid', 'herringbone']);

    const result = await getFabricFilterOptions();

    expect(result.materials).toEqual(['wool', 'cotton', 'linen']);
    expect(result.colors).toEqual(['navy', 'white']);
    expect(result.patterns).toEqual(['solid', 'herringbone']);
  });

  it('calls distinct for all three fields', async () => {
    const Fabric = require('../src/models/Fabric');
    mockFabricDistinct.mockResolvedValue([]);

    await getFabricFilterOptions();

    expect(Fabric.distinct).toHaveBeenCalledTimes(3);
    expect(Fabric.distinct).toHaveBeenCalledWith('material', { isActive: true });
    expect(Fabric.distinct).toHaveBeenCalledWith('color', { isActive: true });
    expect(Fabric.distinct).toHaveBeenCalledWith('pattern', { isActive: true });
  });
});
