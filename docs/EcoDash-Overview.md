# EcoDash: Comprehensive Overview

*Turn Waste into Worth.*

## 1. What EcoDash is
EcoDash is a **digital recycling marketplace for Sri Lanka**. It links the three groups that recycling depends on:
- **Households (users)** who have waste to get rid of;
- **Collectors** who buy waste from households and sort it;
- **Vendors (recyclers)** who buy sorted waste in bulk to process.

Everyone gains: households earn **cash and reward points**, collectors get a steady **supply**, vendors get **sorted material**, and less waste ends up in landfill.

## 2. The problem it solves
- Households don't know who buys recyclables, so they're thrown away.
- Collectors spend time searching for waste and have no record of who supplied what.
- Vendors buy from scattered, unsorted sources at unpredictable prices.
- Nobody has a record of how much was recycled, or a reason to keep doing it.

**EcoDash's answer:** one platform where offers, requests, pickups, payments, rewards and reports are all in one place, with incentives that encourage people to keep recycling.

## 3. Who uses it
| Role | Who they are | What they do in EcoDash |
|---|---|---|
| **User** | Households and individuals | List waste for sale, accept collectors' requests, drop waste off using a QR code, earn points and cash, redeem rewards |
| **Collector** | Waste collection businesses | Browse users' offers, buy and pick up waste, scan QR codes at drop-offs, keep an inventory, sell sorted waste to vendors |
| **Vendor** | Recycling companies and buyers | Browse collectors' offers, make purchases, manage buying prices and inventory, offer rewards to users |
| **Admin team** | The EcoDash operators | Manage accounts, rates, content, roles and every transaction, from a web portal |

## 4. The complete waste journey
```
Household lists waste  →  Collector requests to buy  →  Household accepts
   →  Pickup and payment (cash + points)  →  Collector's inventory
   →  Collector lists sorted waste  →  Vendor purchases (accept / reject / counter-offer)
   →  Delivered  →  Vendor's inventory  →  Recycled
```

**Two ways households get paid:**
1. **Marketplace sale:** they list an offer with photos, a collector requests to buy it, and pickup and payment follow.
2. **QR drop-off:** they take waste to a collector, the collector scans their personal QR code, enters the weight, and awards **points or cash** instantly.

**Every stage is tracked:**
- Offers: available, pending, sold, cancelled.
- Requests and purchases: pending, accepted, rejected, completed, cancelled.
- Vendors can also receive a counter-offer.

## 5. Mobile app features (iOS and Android)
**For everyone**
- Sign up and log in by role, with a **forgot-password** reset by emailed code and an in-app **Change Password**.
- **Three languages:** English, Sinhala (සිංහල) and Tamil (தமிழ்), switchable at any time and picked automatically from the phone's language.
- A **first-run learning guide** for each role, which can be replayed from Profile.
- **Profile photos**: take one with the camera or choose from the gallery.
- **Help & Support**: FAQs and support contact details, editable by the admin team.
- **Chat and Call** between the two sides of a deal. These unlock only once someone has committed to it.

**Users (households)**
- **Create waste offers** with up to 5 photos and a video, weight, price, city and preferred pickup time.
- **Requests:** accept or reject collectors' requests, then rate the collector after pickup.
- **Map** of verified collection points and the waste types each accepts.
- **Personal QR code** for drop-offs.
- **Points, badges and a leaderboard.** Rewards can be redeemed with vendors.

**Collectors**
- **Dashboard** with collection statistics.
- **Browse User Offers**, filtered by **province, city, waste type and weight range** (0–100, 100–500 and 500+ kg).
- Send purchase requests, complete pickups and pay users.
- **Scan QR** to record drop-offs and award points or cash.
- **My Offers** to sell to vendors, with accept, reject and counter-offer on vendor purchase requests.
- **Inventory** by waste type, and a **performance score** (completion rate, response time and activity).

**Vendors**
- **Dashboard**, plus browsing collectors' offers with the same filters.
- **Purchase requests** and their full status history.
- **Pricing management**: the price paid per waste type.
- **Inventory** of purchased waste.
- **Rewards**: create discounts, vouchers or coupons that users redeem with their points.

## 6. Rewards and motivation
- **Points per kg**, which the admin team can change at any time: E-waste 50, Metal 20, Plastic and Polythene 10, Glass and Paper 5, Organic 3.
- **Cash per kg (LKR)**: E-waste 25, Metal 10, Plastic and Polythene 5, Glass and Paper 2, Organic 1.
- **Badges:** Bronze, Silver, Gold, Platinum and Diamond, for amounts recycled, number of transactions, streaks and completed challenges.
- **Challenges:** daily, weekly, monthly and special targets.
- **Leaderboard**, and **rewards** from vendors in five categories: Food & Beverage, Shopping, Services, Eco-Products and Other.
- **Ratings:** users rate collectors and collectors rate vendors, which builds trust in the marketplace.

## 7. Admin portal (web)
- **Dashboard:** transactions, waste collected, points awarded and new users.
- **Users, Collectors and Vendors:**
  - search and filters (city, status, verification, waste type or business type);
  - register, edit, verify, **deactivate** or **delete** accounts;
  - every deactivation, reactivation and deletion asks for confirmation and **emails the person**.
- **Transactions,** grouped into **Users ↔ Collectors** (drop-offs and marketplace sales), **Collectors ↔ Vendors** and **Rewards**. Each has totals (kilos, points, cash, sales value), status filters and paging.
- **Configuration:** points and cash rates, waste categories and upload limits, all changed live without an app update.
- **Help Content:** FAQs (18 built in) and support contact details.
- **Admin Accounts** and **Roles & Access:**
  - built-in **Executive, Manager and Admin** roles, plus custom roles;
  - **24 permissions that can be switched on or off** per role;
  - safeguards so the last Executive can never be locked out.

## 8. Security and trust
- Secure sign-in with tokens and hashed passwords, plus rate limiting on login and password reset.
- Password reset by a 6-digit emailed code that expires and locks after 5 wrong tries. Resetting signs out every existing session.
- **Role-based permissions** that the server enforces, not just hidden buttons.
- **Account deletion that respects privacy:** personal data is removed, but transaction history stays accurate.
- Chat and Call unlock only once there's a real deal.

## 9. Technology
| Part | Technology |
|---|---|
| Mobile app | React Native with Expo (iOS and Android) |
| Admin portal | Next.js and Tailwind CSS |
| Backend API | Node.js and Express, hosted on Vercel |
| Database | MongoDB Atlas (cloud) |
| Images and video | Cloudinary |
| Chat | Firebase Realtime Database |
| Email | Nodemailer (welcome, reset codes, account notices) |
| Quality | Automated tests: 325 for the mobile app, plus backend API checks |

## 10. Impact and value
- **Environment:** more waste is recycled, tracked by type and weight.
- **Households** earn money and rewards for waste they used to throw away.
- **Collectors** get a steady supply, route planning by city and province, and a performance reputation.
- **Vendors** get sorted material, predictable sourcing and a way to reach customers through rewards.
- **Operators** see and control the whole system from one portal.

## 11. Ready for demonstration
Demo **user, collector and vendor** accounts show an offer at **every stage**, each with photos: available, pending, accepted, rejected, completed, cancelled and counter-offer, plus QR drop-offs and a redeemed reward.

## 12. What could come next
- Translating the rest of the app into Sinhala and Tamil.
- Showing profile photos on offers and in the admin portal.
- Push notifications for new requests and status changes.
- In-app payments.
- A public impact dashboard (e.g. "tonnes recycled this month").
