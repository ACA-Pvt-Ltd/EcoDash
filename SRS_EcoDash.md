# Software Requirements Specification (SRS)

## EcoDash — Waste Management Platform

---

| Field | Detail |
|---|---|
| **Document Version** | 1.0 |
| **Prepared By** | EcoDash Development Team |
| **Date** | March 15, 2026 |
| **Status** | Current Features — Delivered |

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [System Overview](#2-system-overview)
3. [User Roles](#3-user-roles)
4. [Functional Requirements — Current Features](#4-functional-requirements--current-features)
   - 4.1 Authentication & Account Management
   - 4.2 Regular User Features
   - 4.3 Collector Features
   - 4.4 Vendor Features
   - 4.5 Admin Features
5. [Reward & Incentive System](#5-reward--incentive-system)
6. [Marketplace System](#6-marketplace-system)
7. [Non-Functional Requirements](#7-non-functional-requirements)
8. [Supported Platforms](#8-supported-platforms)

---

## 1. Introduction

### 1.1 Purpose

This document describes the software requirements and currently implemented features of **EcoDash**, a digital waste management platform. It is intended for stakeholders, clients, and project reviewers to understand the scope and functionality of the system as built.

### 1.2 Product Description

EcoDash is a mobile application that digitises and incentivises the waste management process in Sri Lanka. It connects three types of participants — **waste generators (Users)**, **waste collectors (Collectors)**, and **waste buyers (Vendors)** — through a structured digital marketplace. Users are rewarded with points or cash for recycling, while collectors and vendors manage waste transactions through the same platform.

### 1.3 Goals

- Encourage responsible waste disposal through financial and reward-based incentives
- Provide a transparent, traceable waste transaction system
- Connect all participants in the waste supply chain through a single digital platform
- Promote environmental sustainability through gamification and community engagement

---

## 2. System Overview

EcoDash consists of two main components:

- **Mobile Application** — Available on iOS, Android, and Web. Separate interfaces are provided for each user role.
- **Cloud Backend** — A RESTful API server handling all data, authentication, and business logic, connected to a cloud database.

### How It Works

```
User disposes waste
      ↓
Collector records the collection and awards the user
      ↓
Collector aggregates waste and lists it for sale
      ↓
Vendor purchases waste from collector
      ↓
Vendor offers rewards — redeemable by users with their points
```

---

## 3. User Roles

The platform supports four distinct roles, each with a dedicated interface and set of permissions.

| Role | Description |
|---|---|
| **User** | A member of the public who disposes of waste and earns rewards |
| **Collector** | An individual or organisation that collects waste from users and sells it to vendors |
| **Vendor** | A business that purchases collected waste and provides rewards to users |
| **Admin** | A platform administrator who oversees all users, challenges, rewards, and system data |

---

## 4. Functional Requirements — Current Features

### 4.1 Authentication & Account Management

The following features are available to all roles:

- **Registration** — Users, Collectors, and Vendors can create accounts by selecting their role and providing their details (name, email, phone number, password).
- **Login** — Secure login with email and password. The system automatically directs each user to their role-appropriate dashboard.
- **Session Management** — Users remain logged in across sessions. Sessions expire after 7 days.
- **Profile Update** — All users can update their personal or business profile information.
- **Password Change** — Users can change their password from within the app.
- **Account Deactivation** — Admins can deactivate accounts if required.

---

### 4.2 Regular User Features

#### 4.2.1 Dashboard
The user's home screen provides a real-time summary of their recycling activity:
- Current points balance
- Total waste disposed (in kg)
- Total number of transactions
- Number of badges earned
- Waste recycled this month
- Breakdown of waste by type (e.g. plastic, metal, e-waste)

#### 4.2.2 Collection Points Directory
- Users can browse a list of nearby waste collection centres
- Filter collection centres by waste type (E-waste, Plastic, Polythene, Glass, Paper, Metal, Organic)
- Each listing shows the centre's name, address, operating hours, accepted waste types, and distance
- Users can call the centre directly or get directions from within the app

#### 4.2.3 Waste Offer Listing (User Marketplace)
- Users can create a listing to sell their waste directly to a collector
- The listing includes: waste type, quantity, expected price, pickup location, availability dates, and preferred pickup time (Anytime / Morning / Afternoon / Evening / Weekend)
- Users can view all their active and past listings, filtered by status (Available, Pending, Sold)
- Users can delete listings that have not yet been accepted

#### 4.2.4 Purchase Request Management
- When a collector is interested in a user's waste listing, they send a purchase request with their offered price and a proposed pickup time
- The user receives this request and can **Accept** or **Reject** it
- The system highlights "good deal" requests where the offered price meets or exceeds the asking price
- Users can send an optional message when responding to a request
- Once accepted, the user can contact the collector directly from the app

#### 4.2.5 Rewards
- Users can browse available rewards offered by vendors (e.g. discounts, vouchers, goods)
- Each reward shows its name, description, point cost, and remaining quantity
- Users can redeem rewards using their accumulated points
- Upon redemption, a unique code is generated for the user to present to the vendor
- A redemption history tab shows all past redemptions, their codes, and their status (Pending / Used)

#### 4.2.6 Leaderboard & Community Ranking
- A global leaderboard ranks all users by total waste recycled
- The top 3 users receive gold, silver, and bronze recognition
- The current user's ranking is highlighted for easy reference

#### 4.2.7 Badges & Achievements
- Users earn badges automatically as they reach recycling milestones
- Badges have five rarity tiers: Bronze, Silver, Gold, Platinum, and Diamond
- Earned badges are displayed on the user's profile

#### 4.2.8 QR Code Identity
- Every user has a personal QR code accessible from their profile
- This QR code is scanned by collectors when recording a waste collection at a collection point

---

### 4.3 Collector Features

#### 4.3.1 Dashboard
The collector's home screen provides:
- Today's collection count and total weight collected
- Monthly statistics: total collections, total weight, types of waste accepted
- A breakdown of waste collected per type for the current month
- Quick access buttons to scan QR codes, view inventory, find vendors, and edit profile

#### 4.3.2 QR Code Scanner & Waste Collection Recording
This is the primary operational tool for collectors:
- Collectors open the camera to scan a user's QR code at the point of collection
- A manual entry option is available as a fallback
- After scanning, the user's profile is displayed including their name, contact info, current points, and recent transactions
- The collector then fills in a collection form:
  - Waste type
  - Weight (in kg)
  - Reward type: **Points** or **Cash** (the system automatically calculates how much the user will receive)
- Upon submission, the user is immediately awarded the points or cash in their account

#### 4.3.3 Waste Inventory Management
- The collector's inventory shows all waste collected, organised by type and status
- Status filters: All, Available, In Offers, Pending, Sold
- Each waste type card shows quantity and a breakdown across statuses
- Collectors can initiate an offer to a vendor directly from the inventory screen for available stock

#### 4.3.4 User Offer Marketplace (Buy from Users)
- Collectors can browse waste listings created by regular users
- Listings can be filtered by city and waste type
- Each listing shows the waste type, quantity, expected price, location, pickup preference, and availability
- Collectors can send a purchase request to a user specifying their offered price and proposed pickup time
- Collectors can view and manage all requests they have sent to users
- Once a request is accepted, the collector can mark the pickup as complete

#### 4.3.5 Vendor Offer Management
- Collectors can create waste listings targeting vendors, specifying waste type, quantity, and price per kg
- They can update or remove their listings as needed

#### 4.3.6 Vendor Purchase Request Handling
- When a vendor sends a purchase request for a collector's waste listing, the collector can:
  - **Accept** the request
  - **Reject** the request
  - **Counter** with a different price or quantity
  - **Mark as Complete** once the transaction is fulfilled

#### 4.3.7 Profile Management
- Collectors can update their business name, address, location, and accepted waste types

---

### 4.4 Vendor Features

#### 4.4.1 Dashboard
The vendor's home screen provides:
- Today's purchases (count and total weight)
- Weekly and monthly weight purchased
- Total amount spent (LKR)
- Current waste inventory held
- Quick access to browse offers, view inventory, and manage pricing

#### 4.4.2 Waste Offer Marketplace (Buy from Collectors)
- Vendors can browse all available waste listings from collectors
- Each listing shows waste type, quantity, price per kg, and collector details
- Vendors can send purchase requests to collectors for the waste they need

#### 4.4.3 Purchase Management
- Vendors can view all their purchase requests and their statuses
- Vendors can cancel a pending purchase request if needed

#### 4.4.4 Waste Inventory
- Vendors have a dedicated inventory view showing all waste they have purchased, organised by type and quantity

#### 4.4.5 Pricing Configuration
- Vendors can set and update their own price per kg for each waste type
- This pricing is visible to collectors and helps inform offer pricing

#### 4.4.6 Reward Management
- Vendors can create rewards to offer to platform users (e.g. discount vouchers, gifts)
- Each reward has a name, description, image, point cost, and quantity limit
- Vendors can update or remove rewards at any time
- When a user redeems a reward, the vendor receives the redemption record
- Vendors can verify a redemption by entering the user's unique redemption code

#### 4.4.7 Analytics
- Vendors have access to a business analytics view covering their purchase history, spending, and inventory trends

#### 4.4.8 Profile Management
- Vendors can update their business name, contact details, and accepted waste types

---

### 4.5 Admin Features

Administrators manage the platform through a dedicated interface with access to:

| Area | Capabilities |
|---|---|
| **User Management** | View all registered users, activate or deactivate accounts |
| **Collector Management** | Add, edit, verify, or remove collector accounts |
| **Vendor Management** | Add, edit, verify, or remove vendor accounts |
| **Challenge Management** | Create, update, and manage community recycling challenges |
| **Badge Management** | Create and configure badges and their achievement thresholds |
| **System Analytics** | View platform-wide statistics including waste collected, transactions, and active users |
| **Dashboard** | High-level overview of platform health and activity |

---

## 5. Reward & Incentive System

### 5.1 Points & Cash Rewards

When a collector records a waste collection for a user, they choose to reward the user with either **points** or **cash (LKR)**. The rates are fixed per waste type:

| Waste Type | Points per kg | Cash per kg (LKR) |
|---|---|---|
| E-waste | 50 | 25 |
| Metal | 20 | 10 |
| Plastic | 10 | 5 |
| Polythene | 10 | 5 |
| Glass | 5 | 2 |
| Paper | 5 | 2 |
| Organic | 3 | 1 |

### 5.2 Badges

- Badges are automatically awarded as users reach recycling milestones
- Five tiers: **Bronze, Silver, Gold, Platinum, Diamond**
- Each badge has a rarity level: Common, Uncommon, Rare, Epic, or Legendary
- Badges are configured by the Admin

### 5.3 Challenges

- Platform challenges encourage users to recycle specific types or quantities of waste within a time period
- Challenge types: Daily, Weekly, Monthly, and Special
- Users can view active challenges and join them
- Completing a challenge awards bonus points

### 5.4 Leaderboard

- A global ranking of users based on total waste recycled (kg)
- Updated in real time
- Visible to all users on their profile screen

---

## 6. Marketplace System

EcoDash operates a three-tier marketplace:

### Tier 1 — User to Collector
- Users create waste listings with quantity, price, location, and pickup preferences
- Collectors browse listings and send purchase requests with their offered price
- Users accept or reject requests
- Collector picks up the waste and marks the transaction complete

### Tier 2 — Collector to Vendor
- Collectors list their aggregated waste inventory for vendors to purchase
- Vendors browse listings and send purchase requests
- Collectors can accept, reject, or counter-offer
- Upon completion, the vendor's inventory is updated

### Tier 3 — Vendor to User (Rewards)
- Vendors offer rewards (funded by their waste purchases) back to users
- Users spend their points to redeem rewards
- A unique code is generated for each redemption
- Vendors verify codes when users claim their reward

---

## 7. Non-Functional Requirements

| Requirement | Detail |
|---|---|
| **Security** | All user data is protected with encrypted passwords and token-based authentication |
| **Availability** | The backend is hosted on a cloud serverless platform, ensuring high availability |
| **Scalability** | The cloud database and serverless deployment scale automatically with usage |
| **Performance** | The mobile app uses performance optimisations for smooth scrolling and fast screen loads |
| **Data Privacy** | User personal information is stored securely and is not shared between roles beyond what is necessary |
| **File Uploads** | Profile and reward images are supported up to 5 MB per file |
| **Location** | Collector locations are indexed for fast proximity-based searches |

---

## 8. Supported Platforms

| Platform | Support |
|---|---|
| **Android** | Fully supported |
| **iOS** | Fully supported |
| **Web Browser** | Supported via Expo Web |

---

*EcoDash — Software Requirements Specification | Version 1.0 | March 2026*
