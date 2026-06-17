# Maaswad Architecture

## Stack
- **Frontend:** React 19, TypeScript, Vite, Tailwind, React Query, React Router, zustand, PWA (vite-plugin-pwa / Workbox). Hosted on Cloudflare Pages.
- **Backend:** Node.js, Express, MongoDB Atlas (Mongoose), JWT (access + refresh), Helmet, rate limiting, compression. Hosted on Render. Redis-ready for caching.
- **Integrations (config-driven, no refactor to enable):** Firebase Phone OTP + FCM, Resend email, Cloudinary storage, Google Maps (Places/Geocoding/Distance Matrix), payments (dummy → Razorpay/UPI).

## Collections (18)
`users`, `roles`, `home_chefs`, `delivery_partners`, `dishes`, `categories`, `orders`,
`payments`, `settlements`, `reviews`, `notifications`, `addresses`, `coupons`,
`subscriptions`, `catering_orders`, `settings`, `audit_logs`.
(`food_lovers` are `users` with the `food_lover` role — a single identity can hold multiple roles.)

## Key relationships
- `User 1—1 HomeChef` / `User 1—1 DeliveryPartner` (staff profiles attached to an identity).
- `HomeChef 1—* Dish`; `Dish *—1 Category` (by label).
- `Order *—1 User(customer)`, `*—1 HomeChef`, `*—1 DeliveryPartner`, `1—1 Payment`.
- `Review *—1 Order/Dish/Chef/Customer`; ratings roll up to Dish & Chef.
- `Settlement *—* Order` grouped per chef/rider per period.
- `Setting` is a singleton holding pricing, loyalty, referral, content, settlement config.
- 2dsphere geo indexes on chef/rider/address locations for proximity + ETA.

## RBAC
Roles live on the user (`roles[]`) with an `activeRole`. JWT carries the active role; `authorize(...roles)` guards routes. Owners can do everything ops can, plus audit logs, analytics, settings.

## Pricing & money flow
Centralised in `services/pricing.service.js`, driven by `settings.pricing`. Customer total = displayed food (base + hidden margin) + packing + delivery + platform fee − discounts (+ GST). Platform revenue = hidden margin + chef commission + platform fee. Chef receives base − commission.

## Order state machine
`pending_payment → paid → created → chef_notified → chef_accepted → preparing → ready → rider_assigned → pickup_started → picked_up → out_for_delivery → delivered → customer_confirmed → reviewed → settlement_eligible` (with `cancelled` / `rejected` branches). Every transition is appended to `order.timeline`.

## Security
JWT access/refresh with rotation, RBAC, Helmet headers, express-rate-limit (global + stricter on auth), Zod-ready validation middleware, audit logging of privileged actions, sensitive fields (Aadhaar/PAN/bank/license) marked `select:false`. DB connection is non-fatal on boot so the health endpoint stays observable.

## PWA
Installable (manifest + maskable icons), offline shell via Workbox precache, NetworkFirst runtime cache for `/api`, SPA fallback to `index.html`. Mobile-first responsive UI with bottom nav.
