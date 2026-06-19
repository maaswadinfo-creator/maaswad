# Maaswad — Session Handover (for continuing with a new assistant)

Read this top-to-bottom first. It is the single source of truth for project state.

---

## 1. What Maaswad is

A production PWA for **home-cooked food delivery** — verified home chefs sell to customers. Tagline: *"Home Food, Made with Mother's Love."* Founded by **Dr. Chef Vinoth Kumar**.

**Roles (current):** Super Admin (= Platform Owner), Admin (= Operations Manager), Home Chef, Food Lover (customer).
**Delivery is third-party** — the in-house "Delivery Partner" role has been **removed from the UI** (models remain in the DB for compatibility but no portal/login).

---

## 2. Live status — DEPLOYED & WORKING

| Piece | Status | URL |
|------|--------|-----|
| Frontend (PWA) | Cloudflare Pages | **https://maaswad.in** (also `maaswad.pages.dev`) |
| Backend API | Render | **https://maaswad.onrender.com** (health `/health`, docs `/api/docs`) |
| Database | MongoDB Atlas | connected |
| Git repo | GitHub | `github.com/maaswadinfo-creator/maaswad` |

**Deploy flow:** push to `main` → Render auto-rebuilds backend, Cloudflare auto-rebuilds frontend. The user runs `git push` from their Mac (sandbox can't run git on the mounted folder).

Login **works** (real Firebase phone OTP). Firebase project: **`eptomart-a4cd6`** (shared with the user's other app). Authorized domains must include `maaswad.in` + `www.maaswad.in`.

---

## 3. Tech stack

**Backend** (`/backend`, ESM): Node, Express, MongoDB/Mongoose, JWT (access+refresh), Helmet, rate-limit, Swagger. Entry `src/server.js`.
**Frontend** (`/frontend`): React 19, TypeScript, Vite, Tailwind, React Query, React Router v6, Zustand (cart), **Framer Motion**, Firebase JS SDK, canvas-confetti. Build = `vite build` (NO tsc gate).
**Integrations (live):** Firebase (phone OTP + verify + FCM), Cloudinary (signed image uploads), Resend (emails), Google Maps (geocode + distance, backend-only). Payments = dummy gateway, Razorpay-ready.

---

## 4. CRITICAL: how env/config works (read before touching deploy)

The Cloudflare dashboard env vars were NOT baking into the Vite build (caused a "network error → calls to localhost" bug). **Fix in place:** public build config is committed at **`frontend/.env.production`** (Vite auto-loads it at build time). It holds `VITE_API_URL` (`https://maaswad.onrender.com/api/v1`), the Firebase **web** config, and `VITE_CLOUDINARY_CLOUD_NAME` — all public-by-design values, safe to commit. **If the API URL / Firebase needs changing, edit `frontend/.env.production`** (not just the Cloudflare dashboard).

Secrets (git-ignored, also set in dashboards):
- `backend/.env` → MONGODB_URI, JWT secrets, FIREBASE_PROJECT_ID/CLIENT_EMAIL/PRIVATE_KEY (service account), RESEND_API_KEY, CLOUDINARY_*, GOOGLE_MAPS_API_KEY, `CLIENT_URL=*` (CORS). Mirrored in **Render → Environment**.

---

## 5. What's been built

### Backend — complete
- 18 Mongoose models (added **Certificate** registry; HomeChef now has `certificateNumber`, `certificateUrl`, `certificateVerified`).
- Auth: real Firebase phone login (`POST /auth/firebase`), email OTP, JWT refresh, RBAC.
- Controllers/routes: auth, catalog, chef, orders, reviews, customer, **admin**, uploads (Cloudinary signature).
- **Pricing engine** (`services/pricing.service.js`) matches spec (₹200 base → ₹309 customer → ₹180 chef).
- Scripts: `seed.js` (demo data, not run on prod), `profiles.js` (role login accounts), `promote.js` (grant a phone all roles).

### Certificate-based chef approval (NEW)
- Chef applies with **certificate number + uploaded certificate image** (`ChefApply.tsx`).
- Super Admin manages a **Certificate Registry** (`/admin/certificates` GET/POST/DELETE — POST/DELETE owner-only).
- Admin chef list is annotated with `certificateMatch` (is the number in the registry?).
- `reviewChef` **blocks approval unless the cert number is in the registry**; on approve it marks the cert `claimed` and chef `certificateVerified`.
- UI: `AdminChefs.tsx` shows registry manager + per-chef match badge + certificate image + "Verify & Approve" (disabled until match).

### Third-party delivery (NEW)
- Removed delivery portal/routes/nav/Account link. `AdminOrders.tsx` dispatches: Ready → "Hand to courier" (`out_for_delivery`) → "Mark delivered". Endpoint `POST /admin/orders/:id/dispatch`. (Legacy `assignRider` + delivery models still exist but unused.)

### Premium redesign (live)
- **Palette:** `brand` = deep saffron, `burgundy` = accent, `cream`/`ivory` = bg, `charcoal` = text/dark (`ink` kept as alias). In `tailwind.config.js` + `src/index.css`.
- **Dark mode:** class-based toggle in header, persisted, baked into `.card/.input/.btn`.
- **Branding:** `Logo.tsx` = circular icon (`/logo-icon.png`) + "Maaswad" wordmark. Slim header. `AppSplash.tsx` branded loader. `Hero3D.tsx` compact cursor-tilt 3D hero. Glassmorphism floating bottom nav (`CustomerLayout.tsx`).
- **Home:** veg/non-veg super-filter, small category circles, compact highlight strip, staggered dish grid + skeletons.
- **Motion system:** `lib/motion.ts`, `components/motion/{Reveal,PageWrap}`, `ui/{Skeleton,AnimatedNumber,ThemeToggle,EmptyState}`, animated `Button`, `InstallPrompt`, confetti on order placed, animated order-tracking timeline, cart animations, dashboard counters.

---

## 6. Demo login profiles (after running scripts/profiles.js + Firebase test numbers)

| Role | Phone | OTP |
|---|---|---|
| Super Admin | +919000000001 | 100001 |
| Admin | +919000000002 | 100002 |
| Demo Chef | +919000000003 | 100003 |
| Demo User | +919000000009 | 100009 |

Run `node scripts/profiles.js` in **Render → Shell**, then add each phone+code under Firebase → Authentication → Sign-in method → Phone → "Phone numbers for testing". (`promote.js +91...` grants a real phone all roles instead.)

---

## 7. Gotchas that have bitten us (IMPORTANT)

1. **Add a frontend dep → run `npm install` locally and commit `package-lock.json`**, or Cloudflare's `npm ci` fails ("Missing X from lock file"). Render uses lenient `npm install` so it won't catch it.
2. **Build is `vite build` only** (no `tsc`) — type errors don't block deploys. Don't re-add `tsc &&`.
3. **CSS `@apply`**: never `@apply <utility>` inside a class of the same name (circular-dependency build failure — happened with `.font-display`).
4. **PWA service worker caches aggressively** — after deploy, test in an **incognito window** or unregister the SW; a normal refresh can serve stale assets.
5. **Cloudflare dashboard env vars weren't baking** → that's why config now lives in committed `frontend/.env.production`.
6. **Firebase authorized domains** must include the live domain or phone OTP is blocked.
7. **Sandbox limits:** no `npm install` (registry blocked) and no git on the mount. Verify via `node --check` + an import-resolution script (see below); the user pushes from their Mac. GitHub repo owner is `maaswadinfo-creator` (user has a 2nd GitHub account — auth needs the owner account token/login).

---

## 8. Verify-before-push routine (works in the sandbox)

```bash
# backend syntax
cd backend && for f in $(find src scripts -name '*.js'); do node --check "$f"; done
# frontend import resolution (catches missing modules; can't run tsc/vite here)
cd ../frontend && node --input-type=module -e '/* walk src, resolve @/ and relative imports, report missing */'
```
(The import-resolution one-liner has been used all session — re-create it if needed.)

Path mapping: host `/Users/apple/Documents/Claude/Projects/Maaswad` ↔ sandbox bash `/sessions/.../mnt/Maaswad`. Use Read/Edit/Write on the host path; bash on `/sessions/...`.

---

## 9. Recommended next steps

1. **Super Admin must add valid certificate numbers** (Admin → Chefs → Certificate Registry) or no chef can be approved (by design). Optionally preload a starter set via a script.
2. **Seed demo dishes with photos** — the homepage shows "No dishes yet" until real dishes exist; this is the biggest remaining visual win. (Or have the Demo Chef add dishes via the Chef portal.)
3. Remaining premium polish from the user's directive: chef public profile pages + galleries, multi-image dish galleries, search live-suggestions, list virtualization + code-splitting (bundle is ~730 kB), animated push UI.
4. Razorpay when ready (`services/payment.service.js`, set `PAYMENT_PROVIDER=razorpay`).
5. Before real launch: remove demo accounts, set real owner, verify Resend sending domain (`maaswad.in`).

---

## 10. Key files

- Palette/tokens: `frontend/tailwind.config.js`, `frontend/src/index.css`
- Routing: `frontend/src/App.tsx` · Layouts: `components/layout/{CustomerLayout,DashboardLayout}.tsx`
- Brand/motion: `components/{Logo,Hero3D,AppSplash,InstallPrompt}.tsx`, `lib/motion.ts`, `components/motion/*`, `components/ui/*`
- Auth/API: `lib/api.ts`, `context/AuthContext.tsx`, `lib/firebase.ts`
- Certificate flow: `backend/src/models/Certificate.js`, `controllers/admin.controller.js`, `pages/admin/AdminChefs.tsx`, `pages/chef/ChefApply.tsx`
- Backend entry/pricing: `backend/src/server.js`, `services/pricing.service.js`, routes in `backend/src/routes/`
- Scripts: `backend/scripts/{seed,profiles,promote}.js`
- Other docs: `README.md`, `SETUP_GUIDE.md`, `GO_LIVE.md`, `docs/API.md`, `docs/ARCHITECTURE.md`

---

*Maaswad — An initiative by Dr. Chef Vinoth Kumar.*
