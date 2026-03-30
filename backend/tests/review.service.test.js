'use strict';

/**
 * Unit tests for review.service.js.
 * All MongoDB models are mocked to stay in-memory.
 */

const FABRIC_ID = '507f1f77bcf86cd799439011';
const USER_ID   = '507f1f77bcf86cd799439012';
const ORDER_ID  = '507f1f77bcf86cd799439013';
const REVIEW_ID = '507f1f77bcf86cd799439014';

// ── Model mocks ───────────────────────────────────────────────────────────────

const mockReviewCreate  = jest.fn();
const mockReviewFind    = jest.fn();
const mockReviewFindOne = jest.fn();
const mockReviewFindById = jest.fn();
const mockReviewCount   = jest.fn();

jest.mock('../src/models/Review', () => {
  const mock = {
    create:         (...args) => mockReviewCreate(...args),
    find:           (...args) => mockReviewFind(...args),
    findOne:        (...args) => mockReviewFindOne(...args),
    findById:       (...args) => mockReviewFindById(...args),
    countDocuments: (...args) => mockReviewCount(...args),
  };
  return mock;
});

const mockOrderFindOne = jest.fn();
jest.mock('../src/models/Order', () => ({
  findOne: (...args) => mockOrderFindOne(...args),
}));

const mockUserFindById = jest.fn();
jest.mock('../src/models/User', () => ({
  findById: jest.fn(() => ({ select: mockUserFindById })),
}));

const { createReview, getReviewsByFabric, getReviewsByUser, deleteReview, markHelpful } = require('../src/services/review.service');

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeOrder(overrides = {}) {
  return {
    _id: ORDER_ID,
    user: USER_ID,
    status: 'delivered',
    items: [{ fabricId: FABRIC_ID, fabricName: 'Merino Wool', unitPrice: 300, quantity: 1 }],
    ...overrides,
  };
}

function makeReview(overrides = {}) {
  return {
    _id: REVIEW_ID,
    fabric: FABRIC_ID,
    user: USER_ID,
    order: ORDER_ID,
    displayName: 'James T.',
    rating: 5,
    title: 'Great fabric',
    body: 'Loved the quality.',
    isVerifiedPurchase: true,
    helpfulVotes: 0,
    helpfulVoters: [],
    ...overrides,
  };
}

beforeEach(() => jest.clearAllMocks());

// ─────────────────────────────────────────────────────────────────────────────
// createReview
// ─────────────────────────────────────────────────────────────────────────────

describe('createReview', () => {
  it('creates a review when all conditions are met', async () => {
    mockOrderFindOne.mockReturnValue({ lean: () => Promise.resolve(makeOrder()) });
    mockReviewFindOne.mockReturnValue({ lean: () => Promise.resolve(null) });
    mockUserFindById.mockReturnValue({ lean: () => Promise.resolve({ firstName: 'James', lastName: 'Taylor' }) });
    mockReviewCreate.mockResolvedValue(makeReview());

    const result = await createReview(USER_ID, FABRIC_ID, ORDER_ID, { rating: 5, title: 'Great', body: 'Loved the quality very much indeed' });

    expect(result).toMatchObject({ rating: 5, isVerifiedPurchase: true });
    expect(mockReviewCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        fabric: FABRIC_ID,
        user: USER_ID,
        order: ORDER_ID,
        isVerifiedPurchase: true,
        rating: 5,
      })
    );
  });

  it('throws 404 when order not found', async () => {
    mockOrderFindOne.mockReturnValue({ lean: () => Promise.resolve(null) });

    await expect(
      createReview(USER_ID, FABRIC_ID, ORDER_ID, { rating: 4 })
    ).rejects.toMatchObject({ status: 404 });
  });

  it('throws 422 when order is not delivered', async () => {
    mockOrderFindOne.mockReturnValue({ lean: () => Promise.resolve(makeOrder({ status: 'confirmed' })) });

    await expect(
      createReview(USER_ID, FABRIC_ID, ORDER_ID, { rating: 4 })
    ).rejects.toMatchObject({ status: 422, message: expect.stringContaining('delivered') });
  });

  it('throws 422 when fabric is not in the order', async () => {
    const orderWithDifferentFabric = makeOrder({ items: [{ fabricId: 'other-fabric-id', fabricName: 'Cotton', unitPrice: 100, quantity: 1 }] });
    mockOrderFindOne.mockReturnValue({ lean: () => Promise.resolve(orderWithDifferentFabric) });

    await expect(
      createReview(USER_ID, FABRIC_ID, ORDER_ID, { rating: 4 })
    ).rejects.toMatchObject({ status: 422, message: expect.stringContaining('not part') });
  });

  it('throws 409 when user has already reviewed this order', async () => {
    mockOrderFindOne.mockReturnValue({ lean: () => Promise.resolve(makeOrder()) });
    mockReviewFindOne.mockReturnValue({ lean: () => Promise.resolve(makeReview()) });

    await expect(
      createReview(USER_ID, FABRIC_ID, ORDER_ID, { rating: 5 })
    ).rejects.toMatchObject({ status: 409, message: expect.stringContaining('already reviewed') });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// getReviewsByFabric
// ─────────────────────────────────────────────────────────────────────────────

describe('getReviewsByFabric', () => {
  it('returns paginated reviews', async () => {
    mockReviewFind.mockReturnValue({
      sort:  jest.fn().mockReturnThis(),
      skip:  jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      lean:  () => Promise.resolve([makeReview()]),
    });
    mockReviewCount.mockResolvedValue(1);

    const result = await getReviewsByFabric(FABRIC_ID, { page: 1, limit: 10 });

    expect(result.reviews).toHaveLength(1);
    expect(result.total).toBe(1);
    expect(result.page).toBe(1);
    expect(result.pages).toBe(1);
  });

  it('defaults to page 1 and limit 10', async () => {
    mockReviewFind.mockReturnValue({
      sort:  jest.fn().mockReturnThis(),
      skip:  jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      lean:  () => Promise.resolve([]),
    });
    mockReviewCount.mockResolvedValue(0);

    const result = await getReviewsByFabric(FABRIC_ID);

    expect(result.page).toBe(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// getReviewsByUser
// ─────────────────────────────────────────────────────────────────────────────

describe('getReviewsByUser', () => {
  it('returns paginated reviews for the user', async () => {
    mockReviewFind.mockReturnValue({
      sort:     jest.fn().mockReturnThis(),
      skip:     jest.fn().mockReturnThis(),
      limit:    jest.fn().mockReturnThis(),
      populate: jest.fn().mockReturnThis(),
      lean:     () => Promise.resolve([makeReview()]),
    });
    mockReviewCount.mockResolvedValue(1);

    const result = await getReviewsByUser(USER_ID);

    expect(result.reviews).toHaveLength(1);
    expect(result.total).toBe(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// deleteReview
// ─────────────────────────────────────────────────────────────────────────────

describe('deleteReview', () => {
  it('allows the review author to delete', async () => {
    const deleteFn = jest.fn().mockResolvedValue({});
    mockReviewFindById.mockResolvedValue({
      ...makeReview(),
      deleteOne: deleteFn,
    });

    await expect(deleteReview(REVIEW_ID, USER_ID, 'user')).resolves.toBeUndefined();
    expect(deleteFn).toHaveBeenCalled();
  });

  it('allows an admin to delete any review', async () => {
    const deleteFn = jest.fn().mockResolvedValue({});
    mockReviewFindById.mockResolvedValue({
      ...makeReview({ user: 'another-user-id' }),
      deleteOne: deleteFn,
    });

    await expect(deleteReview(REVIEW_ID, 'admin-user-id', 'admin')).resolves.toBeUndefined();
    expect(deleteFn).toHaveBeenCalled();
  });

  it('throws 403 when a non-owner non-admin tries to delete', async () => {
    mockReviewFindById.mockResolvedValue({ ...makeReview(), deleteOne: jest.fn() });

    await expect(deleteReview(REVIEW_ID, 'stranger-id', 'user')).rejects.toMatchObject({ status: 403 });
  });

  it('throws 404 when review not found', async () => {
    mockReviewFindById.mockResolvedValue(null);

    await expect(deleteReview(REVIEW_ID, USER_ID, 'user')).rejects.toMatchObject({ status: 404 });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// markHelpful
// ─────────────────────────────────────────────────────────────────────────────

describe('markHelpful', () => {
  it('increments helpfulVotes and returns new count', async () => {
    const saveFn = jest.fn().mockResolvedValue({});
    const reviewDoc = {
      ...makeReview({ helpfulVotes: 2, helpfulVoters: [] }),
      save: saveFn,
    };
    mockReviewFindById.mockReturnValue({ select: () => Promise.resolve(reviewDoc) });

    const result = await markHelpful(REVIEW_ID, USER_ID);

    expect(result.helpfulVotes).toBe(3);
    expect(saveFn).toHaveBeenCalled();
  });

  it('throws 409 if user has already voted', async () => {
    const reviewDoc = {
      ...makeReview({ helpfulVotes: 1, helpfulVoters: [USER_ID] }),
      save: jest.fn(),
    };
    // Simulate user ID toString matching
    reviewDoc.helpfulVoters = [{ toString: () => USER_ID }];
    mockReviewFindById.mockReturnValue({ select: () => Promise.resolve(reviewDoc) });

    await expect(markHelpful(REVIEW_ID, USER_ID)).rejects.toMatchObject({ status: 409 });
  });

  it('throws 404 when review not found', async () => {
    mockReviewFindById.mockReturnValue({ select: () => Promise.resolve(null) });

    await expect(markHelpful(REVIEW_ID, USER_ID)).rejects.toMatchObject({ status: 404 });
  });
});
