/**
 * Builders for API payloads. Every factory takes an override object so a test
 * can omit or corrupt exactly one field — which is how the null-crash and
 * partial-data cases are expressed without hand-writing whole fixtures.
 */

export const makeUser = (overrides: Record<string, any> = {}) => ({
  _id: 'user-1',
  name: 'Nimal Perera',
  email: 'nimal@example.com',
  phone: '+94771234567',
  role: 'user',
  points: 120,
  cashEarned: 450,
  totalWasteDisposed: 32,
  qrCode: 'QR-USER-1',
  badges: [],
  ...overrides,
});

export const makeCollector = (overrides: Record<string, any> = {}) => ({
  _id: 'collector-1',
  name: 'Green Recyclers',
  email: 'green@example.com',
  phone: '+94112345678',
  role: 'collector',
  acceptedWasteTypes: ['Plastic', 'Metal'],
  averageRating: 4.3,
  ratingCount: 12,
  totalWasteCollected: 540,
  totalTransactions: 30,
  address: { street: '12 Main St', city: 'Colombo' },
  location: { type: 'Point', coordinates: [79.8612, 6.9271] },
  performance: {
    score: 72,
    collectionsLast30Days: 14,
    completionRate: 90,
    avgResponseHours: 3.5,
  },
  ...overrides,
});

export const makeVendor = (overrides: Record<string, any> = {}) => ({
  _id: 'vendor-1',
  name: 'EcoPlast Ltd',
  email: 'vendor@example.com',
  role: 'vendor',
  businessType: 'Recycler',
  averageRating: 4.0,
  ratingCount: 5,
  ...overrides,
});

export const makeOffer = (overrides: Record<string, any> = {}) => ({
  _id: 'offer-1',
  wasteType: 'Plastic',
  quantity: { value: 10, unit: 'kg' },
  expectedPrice: 500,
  description: 'Clean PET bottles',
  status: 'available',
  images: [],
  location: { address: '12 Main St', city: 'Colombo' },
  createdAt: '2026-07-01T00:00:00.000Z',
  ...overrides,
});

export const makePurchaseRequest = (overrides: Record<string, any> = {}) => ({
  _id: 'request-1',
  status: 'pending',
  offeredPrice: 450,
  message: 'Can collect tomorrow',
  userRated: false,
  collector: makeCollector(),
  userOffer: makeOffer(),
  createdAt: '2026-07-02T00:00:00.000Z',
  ...overrides,
});

export const makeReward = (overrides: Record<string, any> = {}) => ({
  _id: 'reward-1',
  name: 'Grocery Voucher',
  description: 'LKR 500 off',
  pointsCost: 100,
  quantity: 5,
  isActive: true,
  ...overrides,
});

/** Backend envelope: every response is { success, data?, message? } */
export const ok = <T,>(data: T, extra: Record<string, any> = {}) => ({
  success: true,
  data,
  ...extra,
});

export const fail = (message = 'Something went wrong') => ({
  success: false,
  message,
});
