# EcoDash — Data Flow Diagrams (detail)

Companion to [system-architecture.md](system-architecture.md) §7–8, which holds the **Level 0** and **Level 1** diagrams and the identifier tables. This file holds the **Level 2** decompositions. Evidence labels: **[V]** verified in code, **[I]** inferred, **[U]** unknown, **[R]** recommended.

## Notation

| Shape | Meaning | IDs |
|---|---|---|
| `[ Rectangle ]` | External entity: a person or system outside EcoDash | E1 User · E2 Collector · E3 Vendor · E4 Admin · E5 Cloudinary · E6 SMTP · E7 Firebase RTDB |
| `(( Circle ))` | Process. Level 2 IDs are `<parent>.<n>`, e.g. 2.4 | P1–P6 at Level 1 |
| `[( Cylinder )]` | Data store | D1 Accounts · D2 Admin roles · D3 User offers & bids · D4 Collector offers & purchases · D5 Drop-off transactions · D6 Rewards/redemptions/challenges/badges/ratings · D7 App config & vendor pricing · D8 Media (Cloudinary assets, drawn as E5) |
| Arrow with label | The data that moves (not a control signal) | — |
| `{ Diamond }` | Decision inside a process, used sparingly | — |

Every Level-2 diagram starts with the same authentication and authorisation gate, **protect → authorize(role)**, described in 2-A. For brevity, later diagrams show it as a single process named "Auth gate".

---

## 2-A Authentication & password reset

Decomposes **P1**. Sources: [backend/routes/auth.js](../../backend/routes/auth.js), [backend/controllers/authController.js](../../backend/controllers/authController.js), [backend/middleware/auth.js](../../backend/middleware/auth.js), [backend/models/plugins/passwordReset.js](../../backend/models/plugins/passwordReset.js), [backend/utils/email.js](../../backend/utils/email.js).

```mermaid
flowchart TB
    E1["E1–E4 Any account holder"]
    E6["E6 SMTP"]
    D1[("D1 Accounts<br/>users / collectors / vendors / admins")]
    D2[("D2 Admin roles")]

    P11(("1.1<br/>Rate-limit<br/>10 per 15 min / IP"))
    P12(("1.2<br/>Select collection<br/>by role"))
    P13(("1.3<br/>Verify password<br/>and account state"))
    P14(("1.4<br/>Issue JWT<br/>{id, role}, 7d"))
    P15(("1.5<br/>Resolve admin<br/>permissions"))
    P16(("1.6<br/>Create reset code"))
    P17(("1.7<br/>Verify code and<br/>set password"))
    P18(("1.8<br/>protect: verify token<br/>on every request"))

    E1 -->|"email, password, role"| P11
    E1 -->|"email, role (forgot)"| P11
    E1 -->|"email, role, code, new password (reset)"| P11
    P11 -->|"request within limit"| P12
    P12 -->|"email lookup"| D1
    D1 -->|"account + bcrypt hash"| P13
    P13 -->|"id, role"| P14
    P13 -->|"admin id"| P15
    P15 <-->|"role, permission keys (seed or migrate)"| D2
    P15 -->|"adminRole assignment"| D1
    P15 -->|"permissions[]"| P14
    P14 -->|"token + profile subset"| E1

    P12 -->|"active account"| P16
    P16 -->|"SHA-256(code), expiry 15 min, attempts 0"| D1
    P16 -->|"6-digit code"| E6
    E6 -->|"email with code"| E1
    P16 -->|"same message whether or not account exists"| E1

    P12 -->|"account + code hash"| P17
    P17 -->|"attempts + 1 on mismatch"| D1
    P17 -->|"bcrypt(new password), passwordChangedAt, cleared code"| D1
    P17 -->|"success or 'Invalid or expired code' (400)"| E1

    E1 -->|"Bearer JWT"| P18
    D1 -->|"isActive, deletedAt, passwordChangedAt"| P18
    P18 -->|"req.user, req.userRole or 401/403/404"| E1
```

| Process | Validation and authorisation | Notes |
|---|---|---|
| 1.1 | express-rate-limit, in-memory store | Per serverless instance [I] |
| 1.3 | bcrypt compare. `isActive` must be true (403). | Email is not lower-cased on login [V] |
| 1.4 | — | `JWT_EXPIRE` default 7d. No refresh token. |
| 1.5 | Executive gets every key. Role-less admins are migrated to Executive. | Runs once per process for seeding |
| 1.6 | Only for existing **active** accounts | If the email send fails, the code is cleared [V] |
| 1.7 | Expiry, ≤5 attempts, `crypto.timingSafeEqual` | `passwordChangedAt` back-dated 1 s so a fresh login is accepted |
| 1.8 | HS256 pinned. Account exists, not deleted (401), active (403), `iat` ≥ `passwordChangedAt` (401). | `changePassword` does not set `passwordChangedAt` [V] |

---

## 2-B User → collector deal lifecycle

Decomposes **P2**. Sources: `userController.createWasteOffer / getMyOffers / getPurchaseRequests / respondToPurchaseRequest / deleteWasteOffer / rateCollector`, `collectorController.browseUserOffers / createUserPurchaseRequest / getMyUserPurchaseRequests / completeUserWastePickup / cancelUserPurchaseRequest`, [backend/middleware/upload.js](../../backend/middleware/upload.js).

```mermaid
flowchart TB
    E1["E1 User"]
    E2["E2 Collector"]
    E5["E5 Cloudinary"]
    D1[("D1 Accounts")]
    D3[("D3 User offers & bids<br/>userwasteoffers, collectorpurchaserequests")]
    D6[("D6 Ratings")]

    G(("2.0<br/>Auth gate<br/>user or collector"))
    P21(("2.1<br/>Upload offer media"))
    P22(("2.2<br/>Create offer"))
    P23(("2.3<br/>Browse available<br/>offers"))
    P24(("2.4<br/>Create bid"))
    P25(("2.5<br/>Respond to bid"))
    P26(("2.6<br/>Cancel bid"))
    P27(("2.7<br/>Complete pickup<br/>and settle"))
    P28(("2.8<br/>Recompute collector<br/>performance"))
    P29(("2.9<br/>Rate collector"))

    E1 -->|"JWT + multipart: type, quantity JSON, location JSON, images ≤5, video ≤1"| G
    E2 -->|"JWT + filters, bids, completion"| G
    G --> P21
    P21 -->|"image/video streams"| E5
    E5 -->|"secure URLs"| P21
    P21 -->|"URLs + fields"| P22
    P22 -->|"offer status available"| D3
    G -->|"wasteType, city, qty range"| P23
    D3 -->|"available offers within dates + user name, email, phone, address"| P23
    P23 -->|"offer list"| E2
    G -->|"offerId, offeredPrice, pickup time"| P24
    D3 -->|"offer status, existing pending bid"| P24
    P24 -->|"request pending, offer → pending"| D3
    G -->|"requestId, accepted or rejected, message"| P25
    D3 -->|"request (owner check: request.user = caller)"| P25
    P25 -->|"request status, respondedAt"| D3
    G -->|"requestId"| P26
    P26 -->|"request cancelled, offer → available if no other pending"| D3
    G -->|"requestId, paymentAmount"| P27
    D3 -->|"accepted request + offer qty and type"| P27
    P27 -->|"request completed + finalPayment, offer sold"| D3
    P27 -->|"User cashEarned += payment, points += floor(kg x 10), totalWasteDisposed"| D1
    P27 -->|"Collector totalWasteCollected, totalTransactions"| D1
    P27 --> P28
    P28 -->|"performance subdocument"| D1
    G -->|"requestId, score, comment"| P29
    P29 -->|"rating (unique per rater + deal)"| D6
    P29 -->|"collector averageRating, ratingCount"| D1
    P27 -->|"payment + points summary"| E2
```

**Data transformations**
- Multipart fields `quantity` and `location` arrive as JSON strings and are parsed. Invalid JSON returns 400. [V]
- `finalPayment = paymentAmount ‖ proposedPrice ‖ offeredPrice`. Points are fixed at `floor(kg × 10)`, independent of waste type and of AppConfig. [V]
- The `collector.inventory[...]` increment in 2.7 targets a path that is not in the schema. It is **not persisted** [I], and the collector inventory screen never reflects these pickups. [V]

**Behaviour and gaps** [V]:
- 2.4 moves the offer to `pending`, and 2.4 also requires `available`. So **only one collector can have a bid open on an offer at a time**: the marketplace is first-come, not competitive bidding.
- 2.5 *reject* leaves the offer `pending`. No other collector can then bid, and browse hides it. The offer is stuck until the user cancels it (`DELETE /users/offers/:id`).
- There is no transaction around 2.7.

---

## 2-C QR drop-off

Decomposes **P3**. Sources: `collectorController.getUserByQR`, `collectorController.verifyDropoff` (mounted at `/verify-dropoff` and `/record-collection`), [backend/utils/helpers.js](../../backend/utils/helpers.js), [frontend/app/(collector-tabs)/scan.tsx](../../frontend/app/%28collector-tabs%29/scan.tsx).

```mermaid
flowchart TB
    E2["E2 Collector (scanner)"]
    E1["E1 User (shows QR)"]
    D1[("D1 Accounts")]
    D5[("D5 Drop-off transactions")]
    D6[("D6 Badges")]
    D7[("D7 App config")]

    G(("3.0<br/>Auth gate<br/>collector"))
    P31(("3.1<br/>Resolve QR<br/>to user"))
    P32(("3.2<br/>Validate drop-off"))
    P33(("3.3<br/>Compute reward"))
    P34(("3.4<br/>Record verified<br/>transaction"))
    P35(("3.5<br/>Credit user<br/>and award badges"))
    P36(("3.6<br/>Update collector stats<br/>and score"))

    E1 -->|"QR image (JSON with userId)"| E2
    D7 -->|"cash_per_kg (fetched by app via /api/config)"| E2
    E2 -->|"JWT + qrCode text"| G
    G --> P31
    D1 -->|"user by _id or by stored qrCode"| P31
    P31 -->|"name, email, phone, points, last 5 drop-offs here"| E2
    E2 -->|"userId, wasteType, kg, rewardType, cashAmount (client-computed)"| G
    G --> P32
    P32 -->|"wasteType must be in collector's acceptedWasteTypes"| P33
    D1 -->|"user exists"| P32
    P33 -->|"points = floor(hard-coded rate x kg) or cash = client value"| P34
    P34 -->|"WasteTransaction status verified, location = collector's"| D5
    P34 --> P35
    D6 -->|"active badges"| P35
    P35 -->|"points or cashEarned, totalWasteDisposed, new badges + bonus points"| D1
    P34 --> P36
    P36 -->|"totalWasteCollected, totalTransactions, performance"| D1
    P35 -->|"transaction + new badges"| E2
```

**Trust issues** [V]: `cashAmount` is accepted from the client without being bounded or recomputed. `userId` is any ObjectId, and the user's `isActive`/`deletedAt` are not checked. The QR payload is unsigned JSON. There is no idempotency, so a repeated submit creates a second transaction. Points use the hard-coded table in `helpers.calculatePoints`, not D7.

---

## 2-D Collector → vendor purchase

Decomposes **P4**. Sources: `collectorController.createOffer / getOffers / updateOffer / deleteOffer / getPurchaseRequests / acceptPurchaseRequest / rejectPurchaseRequest / counterOffer / completePurchase / getInventory / rateVendor`, `vendorController.getOffers / purchaseWaste / getPurchases / cancelPurchase / getVendorInventory`.

```mermaid
flowchart TB
    E2["E2 Collector"]
    E3["E3 Vendor"]
    E5["E5 Cloudinary"]
    D1[("D1 Accounts")]
    D4[("D4 Collector offers & purchases<br/>wasteoffers, wastepurchases")]
    D5[("D5 Drop-off transactions")]
    D6[("D6 Ratings")]

    G(("4.0<br/>Auth gate<br/>collector or vendor"))
    P41(("4.1<br/>Create offer<br/>+ media"))
    P42(("4.2<br/>Browse offers"))
    P43(("4.3<br/>Create purchase<br/>and reserve offer"))
    P44(("4.4<br/>Collector response<br/>accept / reject / counter"))
    P45(("4.5<br/>Complete delivery"))
    P46(("4.6<br/>Vendor cancel"))
    P47(("4.7<br/>Derive inventories"))
    P48(("4.8<br/>Rate vendor"))

    E2 -->|"JWT + type, kg, min price/kg, media"| G
    E3 -->|"JWT + filters, purchase, cancel"| G
    G --> P41
    P41 <-->|"files / URLs"| E5
    P41 -->|"WasteOffer available, collector location, expires 7d"| D4
    G -->|"wasteType, minQuantity, maxPrice"| P42
    D4 -->|"available offers + collector name, phone, address"| P42
    P42 -->|"offer list"| E3
    G -->|"offerId, collectorId, type, qty, pricePerUnit, pickupDate"| P43
    D1 -->|"collector exists"| P43
    P43 -->|"offer → reserved, WastePurchase pending, totalAmount = qty x price"| D4
    G -->|"purchaseId + notes or reason or counterPrice"| P44
    P44 -->|"status, collectorResponse; offer → sold (accept) or available (reject)"| D4
    P44 -->|"performance"| D1
    G -->|"purchaseId"| P45
    P45 -->|"status completed, actualPickupDate"| D4
    G -->|"purchaseId"| P46
    P46 -->|"status cancelled, offer → available"| D4
    D5 -->|"verified drop-off kg by type"| P47
    D4 -->|"in-offer, pending, sold, completed purchases"| P47
    P47 -->|"collector: available/inOffers/pending/sold per type"| E2
    P47 -->|"vendor: completed kg and amount per type"| E3
    G -->|"purchaseId, score"| P48
    P48 -->|"rating"| D6
    P48 -->|"vendor averageRating"| D1
```

**Gaps** [V]: in 4.3, the server does not check that `offerId` belongs to `collectorId`, or that `quantity` ≤ the offered quantity. The price is vendor-supplied. 4.4 has no vendor-side path to accept a counter-offer. 4.6 releases the offer even if it is already `sold`. The collector's `DELETE /offers/:id` hard-deletes the offer whatever its status. 4.7 collector inventory excludes marketplace pickups (2-B).

---

## 2-E Reward redemption

Decomposes the rewards part of **P5**. Sources: `vendorController.createReward / updateReward / deleteReward / getRedemptions / verifyRedemption`, `userController.getAvailableRewards / redeemReward / getMyRedemptions`, `helpers.generateRedemptionCode / generateRedemptionQRCode`.

```mermaid
flowchart TB
    E1["E1 User"]
    E3["E3 Vendor"]
    D1[("D1 Accounts")]
    D6[("D6 Rewards & redemptions")]

    G(("5.0<br/>Auth gate"))
    P51(("5.1<br/>Maintain reward<br/>catalogue"))
    P52(("5.2<br/>List available<br/>rewards"))
    P53(("5.3<br/>Validate<br/>redemption"))
    P54(("5.4<br/>Issue code<br/>and QR"))
    P55(("5.5<br/>Debit points,<br/>update stock"))
    P56(("5.6<br/>Verify code<br/>at vendor"))

    E3 -->|"JWT + title, type, pointsRequired, stock, validity"| G
    G --> P51
    P51 -->|"Reward"| D6
    E1 -->|"JWT"| G
    G --> P52
    D6 -->|"active, valid rewards"| P52
    P52 -->|"catalogue"| E1
    E1 -->|"rewardId"| G
    G --> P53
    D6 -->|"isActive, validUntil, stockAvailable, pointsRequired"| P53
    D1 -->|"user points (from req.user)"| P53
    P53 -->|"eligible"| P54
    P54 -->|"8-hex code + QR data URL, expiresAt = validUntil"| D6
    P54 --> P55
    P55 -->|"points -= pointsRequired"| D1
    P55 -->|"redeemed + 1, stock - 1"| D6
    P55 -->|"vendor totalRedemptions + 1"| D1
    P55 -->|"redemption + remaining points"| E1
    E1 -->|"shows code"| E3
    E3 -->|"code"| G
    G --> P56
    D6 -->|"redemption for this vendor"| P56
    P56 -->|"status used or expired"| D6
    P56 -->|"verified details"| E3
```

**Consistency** [I]: 5.3 and 5.5 are check-then-act on `req.user.points` and `stockAvailable`. Parallel redemptions can overdraw points or stock. The vendor reward and redemption endpoints have no client reference in the mobile app [V], so 5.1 and 5.6 may be unused in practice.

---

## 2-F Admin account deletion with RBAC

Decomposes the account-management part of **P6**, plus per-key configuration editing because it shares the same permission mechanism. Sources: [backend/routes/admin.js](../../backend/routes/admin.js), [backend/middleware/auth.js](../../backend/middleware/auth.js) `requirePermission`, [backend/services/adminAccess.js](../../backend/services/adminAccess.js), [backend/services/accountDeletion.js](../../backend/services/accountDeletion.js), `adminController.updateAppConfig`.

```mermaid
flowchart TB
    E4["E4 Admin (portal)"]
    E6["E6 SMTP"]
    EX["Deleted account's owner"]
    D1[("D1 Accounts")]
    D2[("D2 Admin roles")]
    D3[("D3 User offers & bids")]
    D4[("D4 Collector offers & purchases")]
    D6[("D6 Rewards")]
    D7[("D7 App config")]

    P61(("6.1<br/>protect +<br/>authorize admin"))
    P62(("6.2<br/>Resolve role<br/>permissions"))
    P63(("6.3<br/>Check permission<br/>x.delete"))
    P64(("6.4<br/>Cancel open items"))
    P65(("6.5<br/>Anonymise and<br/>revoke sessions"))
    P66(("6.6<br/>Notify owner"))
    P67(("6.7<br/>Per-key config<br/>permission + upsert"))

    E4 -->|"JWT + DELETE /admin/users or collectors or vendors/:id, reason"| P61
    D1 -->|"admin account"| P61
    P61 --> P62
    D2 -->|"role, isExecutive, permission keys"| P62
    P62 -->|"permissions[] cached on req"| P63
    P63 -->|"403 'You don't have permission to ...'"| E4
    P63 -->|"allowed"| P64
    D1 -->|"target not already deleted"| P64
    P64 -->|"user: offers and bids cancelled"| D3
    P64 -->|"collector: offers, bids, purchases cancelled. Vendor: purchases cancelled"| D4
    P64 -->|"vendor rewards isActive false"| D6
    P64 --> P65
    P65 -->|"name 'Deleted role', email deleted-id@deleted.invalid, phone '', random password, personal fields unset, isActive false, deletedAt, passwordChangedAt"| D1
    P65 --> P66
    D7 -->|"support_contact"| P66
    P66 -->|"deletion notice + reason (≤500 chars)"| E6
    E6 --> EX
    P66 -->|"{name, email, emailSent}"| E4

    E4 -->|"JWT + PUT /admin/config {key, value}"| P61
    P62 -->|"permissions[]"| P67
    P67 -->|"content.edit for faq_items/support_contact, else config.edit"| D7
```

**Ordering note** [V]: 6.4 runs before 6.5, so open deals are closed before the account becomes unreachable. Neither step is transactional. A failure in 6.5 after 6.4 leaves cancelled deals on a still-active account.
