# Maaswad — Home Food, Made with Mother's Love

> A production-ready Progressive Web App connecting verified home chefs with food lovers who want authentic, hygienic, homemade Indian food.
>
> **Founded by Dr. Chef Vinoth.**

This repository is a full-stack monorepo: an Express + MongoDB REST API and a React 19 PWA, with role-based access for five user types (Platform Owner, Operations Manager, Delivery Partner, Home Chef, Food Lover).

---

## Repository layout

```
Maaswad/
├── backend/            Node.js + Express + MongoDB (Mongoose) REST API
│   ├── src/
│   │   ├── config/         env config, DB connection, constants (roles, statuses, cuisines)
│   │   ├── models/         18 Mongoose collections
│   │   ├── middleware/     JWT auth, RBAC, validation, rate limiting, error handler, audit
│   │   ├── controllers/    request handlers per domain
│   │   ├── routes/         REST route definitions (mounted at /api/v1)
│   │   ├── services/       pricing engine, payments, settlements, notifications, maps
│   │   ├── utils/          tokens, OTP, ids, logger, ApiError, responses
│   │   ├── docs/           Swagger / OpenAPI spec
│   │   ├── app.js          Express app (helmet, cors, compression, swagger, routes)
│   │   └── server.js       entry point
│   └── scripts/seed.js     seed data (owner, chefs, dishes, delivery partner, coupons)
├── frontend/           React 19 + TypeScript + Vite + Tailwind + PWA
│   └── src/
│       ├── pages/          customer / chef / delivery / admin portals
│       ├── components/     UI primitives + layouts
│       ├── context/        Auth provider + cart store (zustand)
│       ├── lib/            axios API client (token refresh), react-query client
│       └── types/          shared TypeScript models
├── docker-compose.yml  mongo + redis + backend + frontend
├── render.yaml         Render blueprint (API)
└── scripts/            deploy helpers
```

---

## Quick start (local)

### Prerequisites
- Node.js 18+ and npm
- MongoDB running locally (or a MongoDB Atlas URI), or just run `docker compose up mongo`

### 1. Backend

```bash
cd backend
cp .env.example .env          # adjust MONGODB_URI / secrets as needed
npm install
npm run seed                  # loads demo chefs, dishes, coupons, an owner & customer
npm run dev                   # http://localhost:5000  ·  docs at /api/docs
```

### 2. Frontend

```bash
cd frontend
cp .env.example .env          # VITE_API_URL defaults to http://localhost:5000/api/v1
npm install
npm run dev                   # http://localhost:5173
```

### One-command (Docker)

```bash
docker compose up --build     # API :5000 · PWA :8080 · Mongo :27017 · Redis :6379
```

---

## Demo accounts (after `npm run seed`)

OTP login is used everywhere. In development the OTP code is returned in the API response (and shown in a toast on the login screen), so no SMS/email provider is required to test.

| Role | Login (phone) |
|------|---------------|
| Platform Owner / Ops | `+919000000001` (also email `owner@maaswad.app`) |
| Home Chef | seeded chef phone (printed by the seed script) |
| Delivery Partner | `+919000000050` |
| Food Lover (customer) | `+919000000099` |

Log in with any of these on `/login`, then for staff roles open **Account → switch role** (or go straight to `/chef`, `/delivery`, `/admin`).

---

## The pricing engine

All pricing is configurable in **Admin → Settings** (persisted in the `settings` collection) and computed server-side in `backend/src/services/pricing.service.js`. The spec's worked example is covered by a unit assertion:

| Component | Value |
|-----------|-------|
| Chef base price | ₹200 |
| Hidden margin (15%) | +₹30 → **displayed ₹230** |
| Platform fee | ₹10 |
| Packing (₹20/dish) | ₹20 |
| Delivery (< ₹1000) | ₹49 |
| **Customer pays** | **₹309** |
| Chef commission (10%) | ₹20 |
| **Chef receives** | **₹180** |
| Platform revenue | ₹60 (margin + commission + fee) |

Free delivery applies above ₹1000. GST is wired in and toggleable.

---

## Key workflows implemented

- **Auth** — phone/email OTP → JWT access + refresh tokens, rotation, role switching, RBAC.
- **Chef onboarding** — Applied → Verification → Operations Review → Approved → Active.
- **Dish lifecycle** — Created → Pending Approval → Admin Review → Approved/Published (+ pause/resume).
- **Order lifecycle** — checkout → dummy payment → chef notified → accepted → preparing → ready → rider assigned → picked up → out for delivery → delivered → customer confirms → review → settlement-eligible.
- **Delivery** — online/offline toggle, auto/manual rider assignment, status flow, earnings.
- **Settlements** — chef payout eligible after delivery + review, or 24h; next-day release.
- **Reviews & ratings**, loyalty points, referrals, coupons, subscriptions, catering requests.
- **Admin/Owner** — chef/dish/customer/rider management, coupons, settings, revenue dashboard, audit logs.

See [`docs/API.md`](docs/API.md) for the full endpoint reference and [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for schema and design notes.

---

## Payments — Phase 1 and beyond

Phase 1 ships a **dummy gateway** that always succeeds. The provider is an abstraction (`backend/src/services/payment.service.js`); adding Razorpay/UPI/Net-banking is a matter of implementing one more provider object — no caller changes required.

---

## Deployment

- **API → Render**: push to git; Render reads `render.yaml`. Set `MONGODB_URI` and `CLIENT_URL` as secret env vars. Helper: `scripts/deploy-render.sh`.
- **PWA → Cloudflare Pages**: `scripts/deploy-cloudflare.sh` (build output `frontend/dist`, SPA redirects via `_redirects`). Set `VITE_API_URL` to your Render URL at build time.

---

## Verification status

This scaffold was checked in the build environment by: syntax-validating every backend file, resolving the complete backend and frontend import graphs (no missing modules), and unit-testing the pricing engine against the spec example (8/8 assertions pass). A live boot requires `npm install` + a MongoDB instance on your machine — follow the Quick Start above.

---

*Maaswad — Founded by Dr. Chef Vinoth.*
