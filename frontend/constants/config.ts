// API Configuration
// For local development (backend running on port 3000):
// export const API_URL = 'http://192.168.1.181:3000/api';
// For deployed backend on Vercel, use:
export const API_URL = 'https://eco-dash-tawny.vercel.app/api';

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
  COLLECTOR_ACCEPT_PURCHASE: (id: string) => `/collectors/purchase-requests/${id}/accept`,
  COLLECTOR_REJECT_PURCHASE: (id: string) => `/collectors/purchase-requests/${id}/reject`,
  COLLECTOR_COMPLETE_PURCHASE: (id: string) => `/collectors/purchase-requests/${id}/complete`,
  
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
  VENDOR_PURCHASES: '/vendors/purchases', // View purchase history
  VENDOR_CANCEL_PURCHASE: (id: string) => `/vendors/purchases/${id}/cancel`,
  USER_RATE_COLLECTOR: '/users/rate-collector',
  COLLECTOR_RATE_VENDOR: '/collectors/rate-vendor',
  VENDOR_INVENTORY: '/vendors/inventory', // Purchased waste inventory
  VENDOR_PRICING: '/vendors/pricing', // Pricing management
  VENDOR_PROFILE: '/vendors/profile',

  // Public config (no auth)
  APP_CONFIG: '/config',

  // Chat
  CHAT_HISTORY: (roomId: string) => `/chat/history/${roomId}`,
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

// Help & support fallbacks — the live content comes from the admin portal via
// GET /config (see AppConfigContext). These only apply if that request fails,
// so the help screen and the login-screen contact block still work offline.
export type FaqRole = 'all' | 'user' | 'collector' | 'vendor';

export interface FaqItem {
  id: string;
  role: FaqRole;
  question: string;
  answer: string;
}

export interface SupportContact {
  email: string;
  phone: string;
  whatsapp?: string;
  hours?: string;
}

export const SUPPORT_CONTACT: SupportContact = {
  email: 'support@ecodash.lk',
  phone: '+94 11 234 5678',
  whatsapp: '+94 77 123 4567',
  hours: 'Monday to Friday, 9:00 AM – 5:00 PM',
};

export const FAQ_ITEMS: FaqItem[] = [
  {
    id: 'gen-what-is',
    role: 'all',
    question: 'What is EcoDash?',
    answer:
      'EcoDash connects households, waste collectors and recycling vendors on one platform. You hand over recyclable waste, collectors pick it up or accept drop-offs, and vendors buy it on for recycling — and you get rewarded for taking part.',
  },
  {
    id: 'gen-points-cash',
    role: 'all',
    question: 'How do points and cash rewards work?',
    answer:
      'Every waste type has a points rate and a cash rate per kilogram. When a collector records your waste, the reward is calculated automatically and added to your account.',
  },
  {
    id: 'gen-account-trouble',
    role: 'all',
    question: 'I cannot log in or register. What should I do?',
    answer:
      'First check that you selected the correct role on the login screen — households, collectors and vendors each sign in under their own role. If that does not help, contact us using the details below.',
  },
  {
    id: 'user-qr',
    role: 'user',
    question: 'What is my QR code for?',
    answer:
      'Your QR code identifies your account. When you drop waste off with a collector, they scan it and the reward goes straight to you.',
  },
  {
    id: 'col-waste-types',
    role: 'collector',
    question: 'Can I change the waste types I accept?',
    answer:
      'Not from the app. You choose your accepted waste types when you register, and only an administrator can change them afterwards. Contact us and we will update your account.',
  },
  {
    id: 'ven-buy',
    role: 'vendor',
    question: 'How do I buy waste from collectors?',
    answer:
      'Browse Offers shows what collectors currently have available. Send a purchase request on anything you want; the collector can accept, reject or send back a counter-offer.',
  },
];

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
