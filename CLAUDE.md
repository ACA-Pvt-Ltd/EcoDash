# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository layout

Three independent apps in one repo — there is **no root `package.json`**; install and run each separately.

| Directory | App | Stack |
|---|---|---|
| [backend/](backend/) | REST API + Socket.IO | Node/Express 5, Mongoose (MongoDB Atlas), deployed to Vercel |
| [frontend/](frontend/) | EcoDash mobile app | React Native 0.81 / Expo 54, expo-router, TypeScript |
| [my-app/](my-app/) | Admin portal | Next.js 16 (App Router), Tailwind 4, TypeScript |

## Commands

```bash
# backend/ (npm)
npm run dev            # nodemon server.js — listens on PORT (default 3000)
npm start
npm run seed           # DESTRUCTIVE: deleteMany on User/Collector/Vendor/Admin/Badge/Challenge/Reward, then reseeds
ADMIN_EMAIL=... ADMIN_PASSWORD=... node create-admin.js         # create admin
ADMIN_EMAIL=... ADMIN_PASSWORD=... node create-admin.js reset   # reset admin password

# frontend/ (npm)
npm start              # expo start (Metro on 8081)
npm run android        # expo run:android
npm run ios
npm run lint           # expo lint
./build-release.sh     # clean + gradle assembleRelease APK (Hermes + ProGuard)
npx tsc --noEmit       # typecheck

# my-app/ (pnpm — pnpm-lock.yaml / pnpm-workspace.yaml)
pnpm dev               # next dev; run on 3001 (`pnpm dev -p 3001`) since 3000 is the backend's port and only 3001 is in the CORS allowlist
pnpm build
pnpm lint
```

There is no test suite in any of the three apps — no test runner is configured and no test files exist. Verification is manual (run the app / hit the API).

## Architecture

### Roles are separate collections, not a field

Four Mongoose models back the four roles: `User`, `Collector`, `Vendor`, `Admin` (`Admin.role` is `admin` or `superadmin`). A single `POST /api/auth/login` takes `{ email, password, role }` and picks the collection from `role`. The JWT payload is `{ id, role }`, and [backend/middleware/auth.js](backend/middleware/auth.js) `protect` re-does the same switch to load `req.user` and set `req.userRole`; `authorize(...roles)` gates by role.

Consequence: touching roles means editing every switch on role — `protect`, [backend/socket/chatHandler.js](backend/socket/chatHandler.js) `resolveUser`, `authController`, and the mobile role→tab-group routing. A user record does *not* carry its role; the token does.

### Backend request path

`server.js` mounts `/api/{auth,users,collectors,vendors,admin,chat,config}` → `routes/*.js` → `controllers/*.js` (thin routes, fat controllers — 800–1300 lines each). On Vercel, [backend/vercel.json](backend/vercel.json) rewrites everything to `/api`, and [backend/api/index.js](backend/api/index.js) re-exports the same Express app; `server.listen` is skipped when `VERCEL` is set. **Socket.IO is wired up in `server.js` but cannot work on Vercel serverless** — see chat below.

All responses follow `{ success, data?, message? }`. Auth routes are rate-limited (10 req / 15 min).

### Chat has two implementations; only Firebase is live

- The mobile chat screens ([frontend/app/(tabs)/chat.tsx](frontend/app/%28tabs%29/chat.tsx) and the collector/vendor equivalents) read and write **Firebase Realtime Database** at `chats/<roomId>`.
- `backend/socket/chatHandler.js`, `backend/routes/chat.js` (Mongo-backed history), and [frontend/services/socketService.ts](frontend/services/socketService.ts) are the older Socket.IO path. `socketService` is currently imported by nothing.

Room IDs are shared by both: `req_<CollectorPurchaseRequest _id>` (user ↔ collector) and `pur_<WastePurchase _id>` (collector ↔ vendor). [database.rules.json](database.rules.json) currently allows public read/write on `chats`.

### The three-tier marketplace

The core domain flow, spanning most controllers and models:

```
User creates UserWasteOffer
  → Collector sends CollectorPurchaseRequest → user accepts/rejects → collector completes pickup
  → waste lands in collector inventory
  → Collector creates WasteOffer for vendors
  → Vendor creates WastePurchase → collector accepts/rejects → completed → vendor inventory
```

Separately, `WasteTransaction` records direct drop-offs: collector scans the user's QR (`POST /api/collectors/verify-qr`), then records the collection, which awards points and cash.

### Runtime-configurable rates (3 places to keep in sync)

Points/cash per kg, waste categories, and upload limits are stored as `AppConfig` key/value docs, edited from the admin portal's config page, served publicly by `GET /api/config`, and consumed via [frontend/context/AppConfigContext.tsx](frontend/context/AppConfigContext.tsx) (`useAppConfig()`). Hard-coded fallbacks exist in **both** [backend/routes/config.js](backend/routes/config.js) (`DEFAULT_CONFIG`) and [frontend/constants/config.ts](frontend/constants/config.ts) (`WASTE_TYPES` / `POINTS_PER_KG` / `CASH_PER_KG`). Screens should read from `useAppConfig()`, not the constants.

### API base URLs are hard-coded, not env-driven

Both clients hard-code the deployed backend and must be edited by hand for local work:

- [frontend/constants/config.ts](frontend/constants/config.ts) — `API_URL` (commented-out LAN URL for local dev; a device needs the machine's LAN IP, not `localhost`)
- [my-app/lib/api.ts](my-app/lib/api.ts) — `API_URL`

The backend's CORS allowlist is a literal array in [backend/server.js](backend/server.js) (`ALLOWED_ORIGINS`): the deployed admin portal, `localhost:3000/3001/8081`. Requests with no `Origin` (React Native, Postman) are always allowed. Add new dev origins there.

### Mobile app conventions

- Route groups map 1:1 to roles: `(tabs)` = user, `(collector-tabs)` = collector, `(vendor-tabs)` = vendor, plus `(auth)`. `app/index.tsx` + `_layout.tsx` redirect based on the stored role.
- `@/` path alias → `frontend/`. `typedRoutes` and `reactCompiler` are enabled in [frontend/app.json](frontend/app.json), so route strings are type-checked.
- Every endpoint goes in the `ENDPOINTS` map in `constants/config.ts` (functions for parameterized paths) — call sites reference `ENDPOINTS.X`, never raw strings.
- [frontend/services/api.ts](frontend/services/api.ts) is the axios instance: injects the bearer token from AsyncStorage, **returns `response.data` directly** (so callers get the `{ success, data }` envelope, not an axios response), and clears stored auth on any 401.
- AsyncStorage keys: `@waste_app_token`, `@waste_app_user`, `@waste_app_role` (`STORAGE_KEYS`).
- `AuthProvider` + `AppConfigProvider` wrap the app in `app/_layout.tsx`; use `useAuth()` for user/token/login/logout.

### Admin portal

Login posts to the same `/api/auth/login` with `role: 'admin'` and stores the JWT in a JS-readable `ecodash_admin_token` cookie (24 h). [my-app/middleware.ts](my-app/middleware.ts) verifies it edge-side with `jose` using `JWT_SECRET` (which must match the backend's) and redirects to `/login` on failure. Pages are plain client components calling `apiFetch` from `lib/api.ts` against `/api/admin/*`; all those routes are `protect` + `authorize('admin','superadmin')`.

### Uploads

Offer media goes to **Cloudinary** via `multer-storage-cloudinary` ([backend/middleware/upload.js](backend/middleware/upload.js), `offerMediaUpload`: ≤5 images + 1 video, 100 MB cap, folders `ecodash/offers/{images,videos}`), configured by `CLOUDINARY_URL`. `backend/uploads/` is still served statically at `/uploads` and `FEATURES.md` still describes local Multer storage — that documentation is stale.

## Environment

Backend `.env` (see [backend/.env.example](backend/.env.example)): `MONGODB_URI`, `JWT_SECRET`, `JWT_EXPIRE` (7d), `PORT`, `NODE_ENV`, plus `CLOUDINARY_URL` and nodemailer credentials used by [backend/utils/email.js](backend/utils/email.js) (welcome emails on admin-created collector/vendor accounts). `my-app/.env.local` needs `JWT_SECRET`. Firebase config is inlined in [frontend/services/firebase.ts](frontend/services/firebase.ts) (project `ecodash-27845`).

## Reference docs

[FEATURES.md](FEATURES.md) — per-screen feature walkthrough and API summary. [SRS_EcoDash.md](SRS_EcoDash.md) — requirements spec. [admin-portal-functions.md](admin-portal-functions.md) — admin capability matrix. These describe intent and are not always in step with the code (e.g. the uploads section); prefer the source when they disagree.
