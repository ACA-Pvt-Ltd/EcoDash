# EcoDash — Feature Documentation

**Version:** 1.0.0
**Platform:** iOS · Android · Web (React Native / Expo)
**Last Updated:** 2026-03-15
**Author:** Senior Mobile Developer

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Architecture](#3-architecture)
4. [Authentication & Onboarding](#4-authentication--onboarding)
5. [User Role — Features](#5-user-role--features)
6. [Collector Role — Features](#6-collector-role--features)
7. [Vendor Role — Features](#7-vendor-role--features)
8. [Admin Role — Features](#8-admin-role--features)
9. [Shared Systems](#9-shared-systems)
10. [API Reference Summary](#10-api-reference-summary)
11. [Data Models](#11-data-models)
12. [Configuration & Constants](#12-configuration--constants)
13. [Known Gaps & Recommendations](#13-known-gaps--recommendations)

---

## 1. Project Overview

EcoDash is a mobile-first waste management marketplace that connects three stakeholder types:

```
Regular Users  →  drop off / list waste for collection
Collectors     →  collect from users, aggregate, sell to vendors
Vendors        →  buy aggregated waste, offer rewards to users
Admins         →  platform governance, analytics, entity management
```

The platform incentivises recycling through a **dual-reward system** (points redeemable for vendor rewards, or direct cash in LKR) and a **gamification layer** (badges, challenges, leaderboard).

---

## 2. Tech Stack

### Frontend
| Concern | Library / Tool | Version |
|---|---|---|
| Framework | React Native | 0.81.5 |
| Build system | Expo | 54.0.22 |
| Routing | Expo Router | 6.0.14 |
| Language | TypeScript | — |
| State / Auth | React Context API | — |
| HTTP client | Axios | — |
| Persistent storage | AsyncStorage | — |
| Maps | react-native-maps | — |
| Camera / QR scan | expo-camera | — |
| QR generation | react-native-qrcode-svg | — |
| Icons | Expo Vector Icons | — |
| Navigation | React Navigation (bottom tabs) | — |
| Animations | React Native Reanimated | — |

### Backend
| Concern | Library / Tool | Version |
|---|---|---|
| Runtime | Node.js | — |
| Framework | Express.js | 5.1.0 |
| ODM | Mongoose | 8.19.3 |
| Database | MongoDB Atlas | Cloud |
| Auth | JWT + bcryptjs | — |
| File uploads | Multer | 5 MB limit |
| QR generation | qrcode | — |
| Validation | express-validator | — |
| Deployment | Vercel (serverless) | — |

---

## 3. Architecture

### System Diagram

```
┌──────────────────────────────────────────────────┐
│                  Expo App (RN)                   │
│  ┌──────────┐  ┌─────────────┐  ┌─────────────┐ │
│  │  (tabs)  │  │(collector-  │  │ (vendor-    │ │
│  │   User   │  │   tabs)     │  │   tabs)     │ │
│  └────┬─────┘  └──────┬──────┘  └──────┬──────┘ │
│       │               │                │         │
│  AuthContext ──── AsyncStorage ─── Axios Client  │
└───────────────────────┬──────────────────────────┘
                        │ HTTPS / JSON
              ┌─────────▼─────────┐
              │  Express.js API   │  (Vercel Serverless)
              │  /api/*           │
              │  JWT Middleware   │
              └─────────┬─────────┘
                        │
              ┌─────────▼─────────┐
              │   MongoDB Atlas   │
              │  (15 collections) │
              └───────────────────┘
```

### Navigation Structure

```
app/
├── (auth)/
│   ├── index.tsx          Welcome / onboarding
│   ├── select-role.tsx    Role picker
│   ├── login.tsx          Login
│   └── register.tsx       Registration
│
├── (tabs)/                ← User role
│   ├── index.tsx          Dashboard
│   ├── map.tsx            Collection points
│   ├── offers.tsx         My waste offers
│   ├── create-offer.tsx   Create offer
│   ├── offer-details.tsx  Offer + purchase requests
│   ├── requests.tsx       Incoming requests
│   └── profile.tsx        Profile / leaderboard
│
├── (collector-tabs)/      ← Collector role
│   ├── index.tsx          Dashboard
│   ├── scan.tsx           QR scanner + collection form
│   ├── inventory.tsx      Waste inventory
│   └── user-offers.tsx    Browse user listings
│
└── (vendor-tabs)/         ← Vendor role
    ├── index.tsx          Dashboard
    ├── offers.tsx         Browse collector offers
    ├── pricing.tsx        Manage pricing
    └── inventory.tsx      Purchased inventory
```

### AsyncStorage Keys
| Key | Content |
|---|---|
| `@waste_app_token` | JWT access token |
| `@waste_app_user` | Serialised user object |
| `@waste_app_role` | `user` / `collector` / `vendor` |

---

## 4. Authentication & Onboarding

### Screens
- **Welcome** — onboarding splash with CTA to login or register
- **Role Selection** — choose User, Collector, or Vendor before registering
- **Register** — unified form, sends role in body; backend creates the correct collection document
- **Login** — email + password + role selector; backend returns JWT + user payload

### Auth Flow
```
App launch
  └─ AuthContext reads AsyncStorage
       ├─ Token found → redirect to role dashboard
       └─ No token   → redirect to (auth)/index
```

### JWT Strategy
- Expiry: **7 days**
- All protected routes require `Authorization: Bearer <token>` header
- Axios request interceptor automatically attaches the stored token
- 401 response → auto logout + redirect to login

### Role-Based Routing
After login, `AuthContext` reads the `role` field and navigates to:
- `user` → `/(tabs)`
- `collector` → `/(collector-tabs)`
- `vendor` → `/(vendor-tabs)`
- `admin` → (admin panel, web-based)

---

## 5. User Role — Features

### 5.1 Dashboard

**File:** `frontend/app/(tabs)/index.tsx`

Displays the user's recycling footprint at a glance.

| Section | Detail |
|---|---|
| Points balance | Current redeemable points |
| Lifetime stats | Total waste disposed (kg), total transactions, badges earned |
| Monthly tracker | Waste recycled this month |
| Waste breakdown | Per-type kg summary |
| Quick action | Navigate to collection points map |

- Pull-to-refresh supported
- Memoised sub-components to minimise re-renders
- Deferred state updates via `InteractionManager`

**API:** `GET /api/users/dashboard`

---

### 5.2 Collection Points Map

**File:** `frontend/app/(tabs)/map.tsx`

Helps users discover nearby waste collection centres.

| UI Element | Detail |
|---|---|
| Waste type filter chips | E-waste, Plastic, Polythene, Glass, Paper, Metal, Organic |
| Collection point cards | Name, address, distance badge, operating hours, accepted waste types |
| Call button | `Linking.openURL('tel:...')` |
| Directions button | Opens device maps app |

- Filter chips update results in real time
- Distance display (sourced from backend geospatial data)

**API:** `GET /api/users/collection-points?wasteType=<type>`

---

### 5.3 Rewards

**File:** `frontend/app/(tabs)/rewards.tsx`

Two-tab interface: **Available** and **History**.

#### Available Tab
- Reward cards: name, description, point cost, quantity remaining
- "Redeem" button disabled if user has insufficient points
- Redeeming generates a unique alphanumeric code displayed to the user

#### History Tab
- Lists all past redemptions
- Shows redemption code, status (Pending / Used), and date

**APIs:**
- `GET /api/users/rewards`
- `POST /api/users/rewards/:rewardId/redeem`
- `GET /api/users/redemptions`

---

### 5.4 My Waste Offers

**File:** `frontend/app/(tabs)/offers.tsx`

Lists all waste offers created by the user.

| Filter Tab | Status shown |
|---|---|
| All | Every offer |
| Available | Open to purchase requests |
| Pending | Collector has made a request, awaiting response |
| Sold | Completed |

Offer cards show: waste type, quantity, asking price, location, status badge, and count of pending purchase requests.

**APIs:**
- `GET /api/users/offers`
- `DELETE /api/users/offers/:id`

---

### 5.5 Create Waste Offer

**File:** `frontend/app/(tabs)/create-offer.tsx`

Full form to list waste for collectors to purchase.

| Field | Type | Notes |
|---|---|---|
| Waste type | Grid selector | 7 types with icons and colours |
| Quantity | Number input | Unit toggle: kg / pieces |
| Expected price | Number input | LKR |
| Description | Textarea | Optional |
| Address / City | Text inputs | Required |
| Available from | Date picker | Required |
| Available until | Date picker | Optional |
| Pickup preference | Card selector | Anytime / Morning / Afternoon / Evening / Weekend |

- Client-side validation: all required fields, price > 0, quantity > 0
- Submits to `POST /api/users/offers`

---

### 5.6 Offer Details

**File:** `frontend/app/(tabs)/offer-details.tsx`

Detailed view of a single offer with incoming purchase requests from collectors.

- Full waste detail section
- Location and availability window
- Purchase request list showing:
  - Collector name and phone
  - Offered price vs. asking price (colour-coded)
  - Proposed pickup time
  - "Good offer!" badge if offered price ≥ asking price
  - Accept / Reject action buttons

**APIs:**
- `GET /api/users/offers`
- `GET /api/users/purchase-requests`
- `PUT /api/users/purchase-requests/:id` (accept / reject)
- `DELETE /api/users/offers/:id`

---

### 5.7 Purchase Requests

**File:** `frontend/app/(tabs)/requests.tsx`

Consolidated view of all purchase requests across all offers.

- Filter tabs: Pending / Accepted / All
- Response modal with optional free-text message to collector
- "Good deal" indicator when collector bid is at or above asking price
- Contact collector shortcut for accepted requests

**APIs:**
- `GET /api/users/purchase-requests`
- `PUT /api/users/purchase-requests/:id`

---

### 5.8 Profile

**File:** `frontend/app/(tabs)/profile.tsx`

| Section | Detail |
|---|---|
| Header | Avatar, display name, rank badge |
| Stats | Points, total waste recycled (kg), badges earned, cash earned (LKR) |
| Badges | Grid of earned badges with level indicators |
| Leaderboard | Top 10 global ranking; gold/silver/bronze medals for top 3; current user highlighted |
| QR Code | Tap to reveal modal with personal QR for collector scanning |
| Account menu | Edit Profile, Notifications, Statistics, Help (stub navigation) |
| Logout | Clears AsyncStorage + redirects to auth |

**API:** `GET /api/users/leaderboard`

---

## 6. Collector Role — Features

### 6.1 Dashboard

**File:** `frontend/app/(collector-tabs)/index.tsx`

| Section | Detail |
|---|---|
| Today's stats | Collections count, weight collected today |
| Monthly stats | Total collections, weight, waste types accepted |
| Waste breakdown | Per-type kg for current month |
| Quick actions | Scan QR, View Inventory, Find Vendors, Profile |

**API:** `GET /api/collectors/dashboard`

---

### 6.2 QR Scanner & Collection Recording

**File:** `frontend/app/(collector-tabs)/scan.tsx`

Core operational screen for collectors.

#### Step 1 — Scan or Enter QR
- Camera overlay with scanning frame
- Manual QR code input fallback

#### Step 2 — User Profile Preview
After successful scan:
- User name, email, phone number
- Current points, total waste disposed, badges earned
- Recent transaction history

#### Step 3 — Record Collection (modal)
| Field | Detail |
|---|---|
| Waste type | 7-type grid selector |
| Reward type | Points or Cash (with live calculation shown) |
| Weight | kg input |
| Notes | Optional |

- Points/cash per kg calculated in real time from config constants
- Submits to backend which awards points/cash to the user's account

**APIs:**
- `POST /api/collectors/verify-qr`
- `POST /api/collectors/record-collection`

---

### 6.3 Waste Inventory

**File:** `frontend/app/(collector-tabs)/inventory.tsx`

Tracks all waste the collector has accumulated.

| Filter Tab | Meaning |
|---|---|
| All | Full inventory |
| Available | Not yet listed in any offer |
| In Offers | Currently in an active vendor offer |
| Pending | Offer accepted, awaiting completion |
| Sold | Completed sales to vendor |

Inventory cards show per-type breakdown with kg counts across all statuses and a "Create Offer" shortcut for available stock.

**API:** `GET /api/collectors/inventory`

---

### 6.4 Browse User Offers

**File:** `frontend/app/(collector-tabs)/user-offers.tsx`

Marketplace for collectors to find and buy waste directly from users.

- **Search:** city text input
- **Filter:** waste type chips
- **Offer cards:** waste type, quantity, expected price, description, user location, pickup preference, availability countdown
- Results count display
- Routes to a purchase request creation flow

**API:** `GET /api/collectors/user-offers`

---

### 6.5 Collector — Additional API Capabilities

These features exist in the backend and are partially or fully accessible via the API but may not have dedicated screens yet:

| Feature | Endpoint |
|---|---|
| Vendor offers (create/manage) | `POST/GET/PUT/DELETE /api/collectors/offers` |
| Vendor purchase requests (accept/reject/counter/complete) | `PUT /api/collectors/purchase-requests/:id/[action]` |
| Own purchase requests to users (complete / cancel) | `PUT/DELETE /api/collectors/user-purchase-requests/:id` |
| Reports & analytics | `GET /api/collectors/reports` |
| Collector profile update | `PUT /api/collectors/profile` |

---

## 7. Vendor Role — Features

### 7.1 Dashboard

**File:** `frontend/app/(vendor-tabs)/index.tsx`

| Stat | Detail |
|---|---|
| Today's purchases | Count of purchase transactions today |
| Today's weight | kg acquired today |
| This week weight | Aggregate kg for current week |
| This month weight | Aggregate kg for current month |
| Total spent | Cumulative LKR spent on waste |
| Current inventory | Total kg currently held |

Quick actions: Browse offers, View inventory, Manage pricing.

**API:** `GET /api/vendors/dashboard`

---

### 7.2 Browse Waste Offers (from Collectors)

**File:** `frontend/app/(vendor-tabs)/offers.tsx`

Marketplace where vendors source waste from collectors.

- Browse active collector waste offers
- Initiate purchase requests
- View pricing per kg

**APIs:**
- `GET /api/vendors/offers`
- `POST /api/vendors/purchase`

---

### 7.3 Pricing Management

**File:** `frontend/app/(vendor-tabs)/pricing.tsx`

Vendors set their own price-per-kg for each waste type. This data can also be surfaced to collectors to inform their offers.

**APIs:**
- `GET /api/vendors/pricing`
- `PUT /api/vendors/pricing`

---

### 7.4 Purchased Inventory

**File:** `frontend/app/(vendor-tabs)/inventory.tsx`

View all waste the vendor has acquired, organised by waste type and status.

**API:** `GET /api/vendors/inventory`

---

### 7.5 Vendor — Additional API Capabilities

| Feature | Endpoint |
|---|---|
| Create / manage rewards for users | `POST/GET/PUT/DELETE /api/vendors/rewards` |
| Verify reward redemption code | `POST /api/vendors/rewards/:code/verify` |
| Redemption records | `GET /api/vendors/redemptions` |
| Purchase history | `GET /api/vendors/purchases` |
| Cancel purchase | `PUT /api/vendors/purchases/:id/cancel` |
| Business analytics | `GET /api/vendors/analytics` |
| Vendor profile update | `PUT /api/vendors/profile` |

---

## 8. Admin Role — Features

Admin access is managed via dedicated API routes and is typically operated via a web interface, not the mobile app.

| Feature | Endpoint |
|---|---|
| Admin dashboard | `GET /api/admin/dashboard` |
| List / update user status | `GET /api/admin/users`, `PUT /api/admin/users/:id/status` |
| Create / manage collectors | `POST/GET/PUT/DELETE /api/admin/collectors` |
| Create / manage vendors | `POST/GET/PUT/DELETE /api/admin/vendors` |
| Create / manage challenges | `POST/GET/PUT /api/admin/challenges` |
| Create / manage badges | `POST/GET /api/admin/badges` |
| System analytics | `GET /api/admin/analytics` |

---

## 9. Shared Systems

### 9.1 Gamification

#### Points System
Awarded when a collector records a waste collection and selects "Points" as the reward type.

| Waste Type | Points per kg |
|---|---|
| E-waste | 50 |
| Metal | 20 |
| Plastic | 10 |
| Polythene | 10 |
| Glass | 5 |
| Paper | 5 |
| Organic | 3 |

#### Cash System
Alternative to points; awarded as LKR per kg.

| Waste Type | LKR per kg |
|---|---|
| E-waste | 25 |
| Metal | 10 |
| Plastic | 5 |
| Polythene | 5 |
| Glass | 2 |
| Paper | 2 |
| Organic | 1 |

#### Badges
Five rarity tiers: **Bronze → Silver → Gold → Platinum → Diamond**
Earned automatically when a user crosses milestones (configured by Admin).

#### Challenges
Types: Daily, Weekly, Monthly, Special
Users join challenges, complete waste disposal goals, and earn bonus points/rewards.

#### Leaderboard
Global ranking based on total waste recycled (kg). Top 3 receive gold, silver, and bronze medals in the Profile screen.

---

### 9.2 QR Code System

Every registered user has a personal QR code:
- **Generation:** `react-native-qrcode-svg` on the frontend (encodes user ID)
- **Scanning:** `expo-camera` barcode scanner on the collector side
- **Verification:** `POST /api/collectors/verify-qr` — backend returns full user profile
- **Fallback:** Manual QR code text input on the scanner screen

---

### 9.3 Waste Marketplace — Three-Tier Flow

```
User creates waste offer
        ↓
Collector browses & sends purchase request
        ↓
User accepts / rejects request
        ↓
Collector picks up waste → marks complete
        ↓
Collector aggregates waste in inventory
        ↓
Collector creates offer to Vendors
        ↓
Vendor sends purchase request to Collector
        ↓
Collector accepts / counter-offers / rejects
        ↓
Transaction completed → Vendor inventory updated
```

---

### 9.4 Geospatial Features

- Collector locations stored with `2dsphere` MongoDB index
- Location stored as `[longitude, latitude]` coordinate pair
- Collection point discovery uses geospatial proximity queries
- Distance badges displayed on collection point cards

---

### 9.5 File Uploads

- Handled by **Multer** middleware
- Max file size: **5 MB**
- Stored at: `backend/uploads/`
- Served statically at `/uploads` endpoint
- Used for: profile images, reward images, verification photos

---

### 9.6 Performance Patterns (Frontend)

| Pattern | Usage |
|---|---|
| `React.memo` | Dashboard sub-components |
| `InteractionManager.runAfterInteractions` | Deferred state updates post-navigation |
| `removeClippedSubviews` | Long ScrollView lists |
| Axios interceptors | Automatic auth token injection |
| Pull-to-refresh | All list/dashboard screens |
| Empty state components | All list screens with actionable CTAs |

---

## 10. API Reference Summary

**Base URL:** `https://waste-management-app-five.vercel.app/api`
**Local Dev:** `http://localhost:3000/api`

All protected routes require: `Authorization: Bearer <JWT>`

### Auth
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | No | Register any role |
| POST | `/auth/login` | No | Login |
| GET | `/auth/me` | Yes | Current user profile |
| PUT | `/auth/update-profile` | Yes | Update profile |
| PUT | `/auth/change-password` | Yes | Change password |

### Users
| Method | Path | Description |
|---|---|---|
| GET | `/users/dashboard` | Dashboard stats |
| GET | `/users/collection-points` | Nearby collectors |
| GET | `/users/transactions` | Transaction history |
| GET | `/users/rewards` | Available rewards |
| POST | `/users/rewards/:id/redeem` | Redeem reward |
| GET | `/users/redemptions` | Redemption history |
| GET | `/users/challenges` | Active challenges |
| POST | `/users/challenges/:id/join` | Join challenge |
| GET | `/users/leaderboard` | Global leaderboard |
| GET | `/users/badges` | Earned badges |
| POST | `/users/offers` | Create waste offer |
| GET | `/users/offers` | My waste offers |
| DELETE | `/users/offers/:id` | Delete offer |
| GET | `/users/purchase-requests` | Incoming requests |
| PUT | `/users/purchase-requests/:id` | Accept / reject |

### Collectors
| Method | Path | Description |
|---|---|---|
| GET | `/collectors/dashboard` | Dashboard stats |
| POST | `/collectors/verify-qr` | Look up user by QR |
| POST | `/collectors/record-collection` | Record waste + award |
| GET | `/collectors/inventory` | Waste inventory |
| GET | `/collectors/user-offers` | Browse user listings |
| POST | `/collectors/user-offers/:id/request` | Create purchase request |
| GET | `/collectors/user-purchase-requests` | Own requests to users |
| PUT | `/collectors/user-purchase-requests/:id/complete` | Complete pickup |
| DELETE | `/collectors/user-purchase-requests/:id` | Cancel request |
| POST | `/collectors/offers` | Create vendor offer |
| GET | `/collectors/offers` | Own vendor offers |
| PUT | `/collectors/offers/:id` | Update vendor offer |
| DELETE | `/collectors/offers/:id` | Delete vendor offer |
| GET | `/collectors/purchase-requests` | Vendor purchase requests |
| PUT | `/collectors/purchase-requests/:id/accept` | Accept |
| PUT | `/collectors/purchase-requests/:id/reject` | Reject |
| PUT | `/collectors/purchase-requests/:id/counter` | Counter offer |
| PUT | `/collectors/purchase-requests/:id/complete` | Complete |
| PUT | `/collectors/profile` | Update profile |
| GET | `/collectors/reports` | Analytics reports |

### Vendors
| Method | Path | Description |
|---|---|---|
| GET | `/vendors/dashboard` | Dashboard stats |
| GET | `/vendors/offers` | Browse collector offers |
| POST | `/vendors/purchase` | Create purchase request |
| GET | `/vendors/purchases` | Purchase history |
| PUT | `/vendors/purchases/:id/cancel` | Cancel purchase |
| GET | `/vendors/inventory` | Purchased inventory |
| GET | `/vendors/pricing` | Waste pricing config |
| PUT | `/vendors/pricing` | Update pricing |
| POST | `/vendors/rewards` | Create user reward |
| GET | `/vendors/rewards` | Own rewards |
| PUT | `/vendors/rewards/:id` | Update reward |
| DELETE | `/vendors/rewards/:id` | Delete reward |
| GET | `/vendors/redemptions` | Redemption records |
| POST | `/vendors/rewards/:code/verify` | Verify redemption code |
| GET | `/vendors/analytics` | Business analytics |
| PUT | `/vendors/profile` | Update profile |

---

## 11. Data Models

### User
```
_id, name, email, phone, password (hashed)
role: 'user'
points, cashEarned (LKR)
totalWasteDisposed (kg)
totalTransactions
badges: [Badge ref]
isActive
createdAt, updatedAt
```

### Collector
```
_id, name, email, phone, password (hashed)
role: 'collector'
businessName, address, location (GeoJSON Point)
acceptedWasteTypes: [String]
totalWasteCollected (kg)
totalTransactions
isVerified, isActive
createdAt, updatedAt
```

### Vendor
```
_id, name, email, phone, password (hashed)
role: 'vendor'
businessName, address
acceptedWasteTypes: [String]
totalInventory (kg)
totalSpent (LKR)
isVerified, isActive
createdAt, updatedAt
```

### WasteTransaction (User → Collector)
```
_id, userId, collectorId
wasteType, quantity (kg)
rewardType: 'points' | 'cash'
pointsAwarded | cashAwarded
notes
createdAt
```

### UserWasteOffer (User → Collector marketplace)
```
_id, userId
wasteType, quantity (kg), unit
expectedPrice (LKR)
description, location (address, city)
availableFrom, availableUntil
pickupPreference: 'anytime' | 'morning' | 'afternoon' | 'evening' | 'weekend'
status: 'available' | 'pending' | 'sold'
createdAt, updatedAt
```

### CollectorPurchaseRequest (Collector bids on user offer)

_id, collectorId, offerId, userId
offeredPrice (LKR)
proposedPickupTime
message (optional)
status: 'pending' | 'accepted' | 'rejected' | 'completed'
createdAt, updatedAt
```

### WasteOffer (Collector → Vendor marketplace)
```
_id, collectorId
wasteType, quantity (kg), pricePerKg (LKR)
description
status: 'available' | 'pending' | 'sold'
createdAt, updatedAt
```

### WastePurchase (Vendor bids on collector offer)
```
_id, vendorId, collectorId, offerId
wasteType, quantity (kg)
pricePerKg, totalPrice (LKR)
status: 'pending' | 'accepted' | 'rejected' | 'completed' | 'cancelled'
createdAt, updatedAt
```

### Reward (Vendor → User)
```
_id, vendorId
name, description, image
pointsCost
quantityAvailable, quantityRedeemed
isActive
createdAt, updatedAt
```

### RewardRedemption
```
_id, userId, rewardId, vendorId
code (unique alphanumeric)
status: 'pending' | 'used'
redeemedAt
createdAt
```

### Badge
```
_id
name, description, image
level: 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond'
rarity: 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary'
pointsRequired
createdAt
```

### Challenge
```
_id
name, description
type: 'daily' | 'weekly' | 'monthly' | 'special'
goal (kg or count)
reward (points)
participants: [userId]
startDate, endDate
isActive
createdAt, updatedAt
```

### VendorPricing
```
_id, vendorId
wasteType
pricePerKg (LKR)
updatedAt
```

---

## 12. Configuration & Constants

**File:** `frontend/constants/config.ts`

```typescript
API_URL = 'https://waste-management-app-five.vercel.app/api'

WASTE_TYPES = [
  'E-waste', 'Plastic', 'Polythene', 'Glass', 'Paper', 'Metal', 'Organic'
]

POINTS_PER_KG = {
  'E-waste': 50, 'Metal': 20, 'Plastic': 10, 'Polythene': 10,
  'Glass': 5, 'Paper': 5, 'Organic': 3
}

CASH_PER_KG_LKR = {
  'E-waste': 25, 'Metal': 10, 'Plastic': 5, 'Polythene': 5,
  'Glass': 2, 'Paper': 2, 'Organic': 1
}

BADGE_LEVELS = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond']

COLORS = {
  primary: '#2ECC71',   // green
  secondary: '#3498DB', // blue
  ...
}
```

**Backend .env**
```
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb+srv://...
JWT_SECRET=waste-management-super-secret-key-2025
JWT_EXPIRE=7d
MAX_FILE_SIZE=5242880
UPLOAD_PATH=./uploads
CLIENT_URL=http://localhost:8081
```

---

## 13. Known Gaps & Recommendations

### Missing Screens / Incomplete Features
| Gap | Notes |
|---|---|
| Vendor rewards management UI | API exists (`/vendors/rewards`), no dedicated mobile screen observed |
| Admin mobile panel | Admin role has full API but no mobile tab group |
| Challenges screen (User) | Route and API exist, no dedicated challenges screen in tabs |
| Collector vendor offers management | API fully built, UI coverage unclear |
| Edit Profile screens | Menu item exists in User profile but routes to stub |
| Notifications | Menu item is stub, no push notification implementation |
| Statistics deep-dive | Menu item is stub |

### Security Observations
| Issue | Recommendation |
|---|---|
| `JWT_SECRET` is a weak hardcoded string | Use a randomly generated 256-bit secret in production |
| No token refresh mechanism | Implement refresh tokens; 7-day access tokens are long-lived |
| No rate limiting visible | Add express-rate-limit to auth routes |
| CORS `CLIENT_URL` is localhost in dev | Ensure production env sets correct domain |

### Architecture Recommendations
| Area | Recommendation |
|---|---|
| Offline support | Add optimistic updates + queue for poor connectivity (common in field use) |
| Image caching | Add `react-native-fast-image` for profile and reward images |
| Error boundaries | Wrap tab screens in React error boundaries to prevent full-app crashes |
| Environment switching | Add `app.config.ts` with EAS environment profiles (dev/staging/prod) |
| TypeScript models | Define shared TS interfaces for API response types; currently implicit |
| State management | As the app grows, consider Zustand or React Query to replace manual fetch + useState patterns |

---

*Document generated by senior mobile developer review — EcoDash v1.0.0*
