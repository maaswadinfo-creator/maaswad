# Maaswad — Session Handover

A complete context document so a new assistant (or you) can continue this project seamlessly. Read this top-to-bottom first.

---

## 1. What Maaswad is

A production PWA for **home-cooked food delivery** — connecting verified home chefs with customers. Tagline: *"Home Food, Made with Mother's Love."* Founded by **Dr. Chef Vinoth Kumar**.

Five roles: Platform Owner, Operations Manager, Delivery Partner, Home Chef, Food Lover (customer).

---

## 2. Current status — IT IS LIVE 🎉

| Piece | Status | URL |
|------|--------|-----|
| Frontend (PWA) | Live on Cloudflare Pages | https://maaswad.com (and `maaswad.pages.dev`) |
| Backend API | Live on Render | https://maaswad.onrender.com (health: `/health`, docs: `/api/docs`) |
| Database | MongoDB Atlas (connected) | — |
| Git repo | GitHub | `github.com/maaswadinfo-creator/maaswad` |

**Deploy workflow:** push to `main` on GitHub → Render auto-rebuilds the backend, Cloudflare auto-rebuilds the frontend. No manual deploy needed.

---

## 3. Tech stack

**Backend** (`/backend`): Node 18+, Express, MongoDB/Mongoose, JWT (access+refresh), Helmet, rate-limit, Swagger. ESM modules. Entry: `src/server.js`.

**Frontend** (`/frontend`): React 19, TypeScript, Vite, Tailwind, React Query, React Router v6, Zustand (cart), **Framer Motion** (animations), Firebase JS SDK (phone OTP), canvas-confetti. Build: `vite build` (NOT `tsc && vite build` — see gotchas).

**Integrations (all wired, keys in env):** Firebase (phone OTP + verify + FCM), Cloudinary (image uploads, signed), Resend (emails), Google Maps (geocoding + distance matrix, backend-only). Payments = dummy gateway, Razorpay-ready.

---

## 4. Where the secrets live (DO NOT commit these)

`.env` files are git-ignored. The same values are also set in the Render and Cloudflare dashboards.

- **`backend/.env`** — MONGODB_URI, JWT secrets, FIREBASE_PROJECT_ID/CLIENT_EMAIL/PRIVATE_KEY (service account), RESEND_API_KEY, CLOUDINARY_*, GOOGLE_MAPS_API_KEY. Mirrored in **Render → Environment**.
- **`frontend/.env`** — VITE_API_URL (`https://maaswad.onrender.com/api/v1`), VITE_FIREBASE_* (web config), VITE_CLOUDINARY_CLOUD_NAME. Mirrored in **Cloudflare → Settings → Variables**.
- Firebase project is **`eptomart-a4cd6`** (shared with the user's other app; Phone sign-in enabled; add live domains under Authentication → Authorized domains).

If a new assistant needs to change keys, edit BOTH the local `.env` and the matching dashboard, then redeploy.

---

## 5. What's been built

### Backend — COMPLETE
- 17 Mongoose models (users, home_chefs, delivery_partners, dishes, categories, orders, payments, settlements, reviews, notifications, addresses, coupons, subscriptions, catering_orders, settings, audit_logs, roles).
- Auth: OTP (dev) + **real Firebase phone login** (`POST /auth/firebase` verifies ID token), JWT refresh rotation, RBAC middleware.
- Controllers/routes for: auth, catalog (public browse), chef (dashboard, dishes CRUD, orders), orders (quote/checkout/pay/track/confirm), delivery, reviews, customer (addresses/notifications/coupons/subscriptions/catering), admin (chef/dish/customer/rider mgmt, coupons, settings, revenue, settlements, audit), uploads (Cloudinary signature).
- **Pricing engine** (`services/pricing.service.js`) — matches spec exactly (base ₹200 → customer ₹309, chef receives ₹180). Configurable via `settings` collection.
- Seed script: `npm run seed` (creates owner, demo chefs/dishes/coupons). **Not yet run on production** — that's why the live homepage has no dishes.

### Frontend — pages exist for every portal
Customer (Home, Search, DishDetail, Cart, Checkout, Orders, OrderTracking, Account, ChefApply), Chef (Dashboard, Dishes, Orders), Delivery (Dashboard, Orders), Admin/Owner (Dashboard, Chefs, Dishes, Orders, Settings), Auth (Login), Landing, NotFound.

### Premium redesign — done in passes (all live)
- **Design foundation:** Plus Jakarta Sans (display) + Inter (body); warm palette; soft/lift shadows.
- **Palette (current):** `brand` = deep saffron, `burgundy` = accent, `cream`/`ivory` = backgrounds, `charcoal` = text/dark. (`ink` is kept as an alias to charcoal for older classes.) Defined in `tailwind.config.js`.
- **Dark mode:** class-based, toggle in header, persisted to localStorage. Baked into shared `.card/.input/.btn` classes in `src/index.css`.
- **Motion system:** `lib/motion.ts` (fadeUp/scaleIn/stagger/pageTransition), `components/motion/Reveal.tsx` + `PageWrap.tsx`, `components/ui/Skeleton.tsx`, `AnimatedNumber.tsx`, animated `Button.tsx`, `ThemeToggle.tsx`.
- **Branding:** `components/Logo.tsx` = circular icon (`/logo-icon.png`) + "Maaswad" wordmark. Full logo at `/logo.png`, founder photo `/founder.jpg`, PWA icons generated.
- **Key components:** `Hero3D.tsx` (cursor-tilt 3D hero, compact), `AppSplash.tsx` (branded loading screen), `InstallPrompt.tsx` (PWA install), `EmptyState.tsx`, `DishCard.tsx` (hover lift + add-to-cart pop).
- **Glassmorphism floating bottom nav** with spring-animated active pill (`CustomerLayout.tsx`).
- Animated: order-tracking timeline, cart (collapse/animated totals), checkout stepper + confetti, dashboard counters, staggered card grids, skeletons everywhere.

---

## 6. Gotchas / things that have bitten us (IMPORTANT)

1. **Cloudflare uses `npm ci`** — if you add/remove an npm dependency, you MUST run `npm install` locally to update `package-lock.json` and commit it, or the Cloudflare build fails with "Missing X from lock file." (Render uses lenient `npm install`, so it won't catch this.)
2. **Frontend build is `vite build` only** (no `tsc`) — so TypeScript type errors do NOT block deploys. Keep a `typecheck` script for local checking. Don't re-add `tsc &&` to the build script or stray type errors will break the deploy.
3. **CSS `@apply`** — never `@apply a-utility` inside a class of the same name (caused a "circular dependency" build failure once with `.font-display`).
4. **Cloudflare env vars are baked at build time** — after changing any `VITE_*` variable you must trigger a rebuild (Deployments → Retry).
5. **Firebase authorized domains** — phone OTP is blocked on any domain not listed in Firebase → Authentication → Settings → Authorized domains (add `maaswad.com` + `maaswad.pages.dev`).
6. **Sandbox can't `npm install`** (registry blocked) and can't run git on the mounted folder — so verification here is done via syntax check + an import-resolution script; the user runs `git push` from their own Mac. Git account note: repo owner is `maaswadinfo-creator`; the user has a second GitHub account, so auth needs the owner account's token/login.
7. **GitHub push** is done by the user (GitHub Desktop or a Personal Access Token for `maaswadinfo-creator`).

---

## 7. How to make a change & ship it

1. Edit files under `/backend` or `/frontend`.
2. If you added a frontend dependency: `cd frontend && npm install` (updates lock file).
3. From the user's Mac terminal (or GitHub Desktop):
   ```bash
   cd "/Users/apple/Documents/Claude/Projects/Maaswad"
   git add -A && git commit -m "..." && git push
   ```
4. Render + Cloudflare auto-rebuild. Hard-refresh the site (Cmd+Shift+R).

Note: in the assistant sandbox, file paths map as `/Users/apple/Documents/Claude/Projects/Maaswad` (host) ↔ `/sessions/.../mnt/Maaswad` (bash). Use Read/Edit/Write with the host path; use bash for `/sessions/...`.

---

## 8. Recommended next steps (in priority order)

1. **Seed production data** — the live homepage looks empty because there are no published dishes. Either run `npm run seed` in Render's Shell, or add dishes-with-photos. THIS is the single biggest visual win.
2. **Remaining premium polish** (from the user's design directive, not yet done): chef public profile pages with food galleries, multi-image dish galleries, search live-suggestions/history, list virtualization for performance, animated push-notification UI, richer offline state.
3. **Verify the full live order flow** end-to-end with a real phone OTP login.
4. **Razorpay** when ready (structure exists in `services/payment.service.js`; set `PAYMENT_PROVIDER=razorpay` + keys).
5. Remove/replace demo seed accounts before real launch; set a real owner.

---

## 9. Key files cheat-sheet

- Palette/tokens: `frontend/tailwind.config.js`, `frontend/src/index.css`
- Routing: `frontend/src/App.tsx`
- Layouts: `frontend/src/components/layout/CustomerLayout.tsx`, `DashboardLayout.tsx`
- Brand: `frontend/src/components/Logo.tsx`, `Hero3D.tsx`, `AppSplash.tsx`
- API client/auth: `frontend/src/lib/api.ts`, `frontend/src/context/AuthContext.tsx`, `firebase.ts`
- Backend pricing: `backend/src/services/pricing.service.js`
- Backend entry: `backend/src/server.js`, routes in `backend/src/routes/`
- Docs already in repo: `README.md`, `SETUP_GUIDE.md`, `GO_LIVE.md`, `docs/API.md`, `docs/ARCHITECTURE.md`

---

*Maaswad — An initiative by Dr. Chef Vinoth Kumar.*
