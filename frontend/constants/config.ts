// API Configuration
// For local development (backend running on port 3000):
// export const API_URL = 'http://192.168.43.196:3000/api';
// For deployed backend on Vercel, use:
export const API_URL = 'https://waste-management-app-five.vercel.app/api';

// API Endpoints
export const ENDPOINTS = {
  // Auth
  REGISTER: '/auth/register', // Unified registration for all roles
  REGISTER_USER: '/auth/register/user', // Legacy endpoint
  LOGIN: '/auth/login',
  ME: '/auth/me',
  UPDATE_PROFILE: '/auth/update-profile',
  CHANGE_PASSWORD: '/auth/change-password',

  // Users
  DASHBOARD: '/users/dashboard',
  COLLECTION_POINTS: '/users/collection-points',
  TRANSACTIONS: '/users/transactions',
  REWARDS: '/users/rewards',
  REDEEM_REWARD: (id: string) => `/users/rewards/${id}/redeem`,
  REDEMPTIONS: '/users/redemptions',
  CHALLENGES: '/users/challenges',
  JOIN_CHALLENGE: (id: string) => `/users/challenges/${id}/join`,
  LEADERBOARD: '/users/leaderboard',
  BADGES: '/users/badges',
  
  // User Waste Offers (User-to-Collector marketplace)
  USER_OFFERS: '/users/offers', // Get user's offers
  USER_CREATE_OFFER: '/users/offers', // Create new waste offer
  USER_DELETE_OFFER: (id: string) => `/users/offers/${id}`, // Delete offer
  USER_PURCHASE_REQUESTS: '/users/purchase-requests', // Get purchase requests from collectors
  USER_RESPOND_REQUEST: (id: string) => `/users/purchase-requests/${id}`, // Accept/reject request

  // Collectors
  COLLECTOR_DASHBOARD: '/collectors/dashboard',
  COLLECTOR_VERIFY_QR: '/collectors/verify-qr',
  COLLECTOR_VERIFY_DROPOFF: '/collectors/verify-dropoff',
  COLLECTOR_RECORD_COLLECTION: '/collectors/record-collection', // Alias
  COLLECTOR_TRANSACTIONS: '/collectors/transactions',
  COLLECTOR_REPORTS: '/collectors/reports',
  COLLECTOR_INVENTORY: '/collectors/inventory',
  COLLECTOR_VENDORS: '/collectors/vendors',
  COLLECTOR_PROFILE: '/collectors/profile',
  COLLECTOR_OFFERS: '/collectors/offers', // Manage waste offers
  COLLECTOR_CREATE_OFFER: '/collectors/offers', // Create new offer
  COLLECTOR_PURCHASE_REQUESTS: '/collectors/purchase-requests', // View purchase requests
  
  // Collector User Waste Marketplace (Browse and buy from users)
  COLLECTOR_USER_OFFERS: '/collectors/user-offers', // Browse user waste offers
  COLLECTOR_CREATE_PURCHASE_REQUEST: (offerId: string) => `/collectors/user-offers/${offerId}/request`, // Request to buy
  COLLECTOR_MY_USER_REQUESTS: '/collectors/user-purchase-requests', // Collector's sent requests
  COLLECTOR_COMPLETE_USER_PICKUP: (requestId: string) => `/collectors/user-purchase-requests/${requestId}/complete`, // Complete pickup
  COLLECTOR_CANCEL_USER_REQUEST: (requestId: string) => `/collectors/user-purchase-requests/${requestId}`, // Cancel request

  // Vendors
  VENDOR_DASHBOARD: '/vendors/dashboard',
  VENDOR_REWARDS: '/vendors/rewards', // Vendor rewards for users
  VENDOR_REDEMPTIONS: '/vendors/redemptions',
  VENDOR_ANALYTICS: '/vendors/analytics',
  VENDOR_OFFERS: '/vendors/offers', // Browse waste from collectors
  VENDOR_PURCHASE: '/vendors/purchase', // Purchase waste
  VENDOR_INVENTORY: '/vendors/inventory', // Purchased waste inventory
  VENDOR_PRICING: '/vendors/pricing', // Pricing management
  VENDOR_PROFILE: '/vendors/profile',
};

// Storage Keys
export const STORAGE_KEYS = {
  TOKEN: '@waste_app_token',
  USER: '@waste_app_user',
  USER_ROLE: '@waste_app_role',
};

// Waste Types
export const WASTE_TYPES = [
  { label: 'E-waste', value: 'E-waste', icon: '📱', color: '#FF6B6B' },
  { label: 'Plastic', value: 'Plastic', icon: '♻️', color: '#4ECDC4' },
  { label: 'Polythene', value: 'Polythene', icon: '🛍️', color: '#45B7D1' },
  { label: 'Glass', value: 'Glass', icon: '🍾', color: '#96CEB4' },
  { label: 'Paper', value: 'Paper', icon: '📄', color: '#FFEAA7' },
  { label: 'Metal', value: 'Metal', icon: '🔩', color: '#DFE6E9' },
  { label: 'Organic', value: 'Organic', icon: '🌱', color: '#00B894' },
];

// Points per kg
export const POINTS_PER_KG = {
  'E-waste': 50,
  'Plastic': 10,
  'Polythene': 10,
  'Glass': 5,
  'Paper': 5,
  'Metal': 20,
  'Organic': 3,
};

// Cash reward per kg (LKR)
export const CASH_PER_KG = {
  'E-waste': 25,
  'Plastic': 5,
  'Polythene': 5,
  'Glass': 2,
  'Paper': 2,
  'Metal': 10,
  'Organic': 1,
};

// Badge Levels
export const BADGE_LEVELS = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'];

// Colors
export const COLORS = {
  primary: '#2ECC71',
  secondary: '#3498DB',
  success: '#27AE60',
  warning: '#F39C12',
  danger: '#E74C3C',
  dark: '#2C3E50',
  light: '#ECF0F1',
  white: '#FFFFFF',
  black: '#000000',
  gray: '#95A5A6',
};
