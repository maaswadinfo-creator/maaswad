# Maaswad — Go-Live Runbook

Deploy Maaswad to production with your real services:

- **Database:** MongoDB Atlas
- **Backend API:** Render
- **Phone OTP:** Firebase Phone Authentication (real SMS)
- **Frontend (PWA):** Cloudflare Pages
- **Images:** Cloudinary · **Emails:** Resend · **Maps:** Google Maps

Do the steps **in order**. Parts A–F collect your keys; Parts G–I deploy. Budget ~60–90 minutes the first time. Keep a notes file open to paste each key as you get it.

> Tip: the app is built so missing keys degrade gracefully — but to go fully live you want all of them set.

---

## Part A — MongoDB Atlas (database)

1. Sign in at https://cloud.mongodb.com and create a **free M0 cluster**.
2. **Database Access → Add New Database User**: create a username + strong password. Save them.
3. **Network Access → Add IP Address → Allow Access from Anywhere** (`0.0.0.0/0`). (Render uses dynamic IPs, so this is required on the free tier.)
4. **Clusters → Connect → Drivers** and copy the connection string. Make it look like:
   ```
   mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/maaswad?retryWrites=true&w=majority
   ```
   Replace `USER`/`PASSWORD`, and ensure `/maaswad` is the database name before the `?`.

🔑 **Save as:** `MONGODB_URI`

---

## Part B — Firebase (phone OTP)

You already have a Firebase project. You need **two** things from it: the **Web config** (for the app) and a **service-account key** (for the server).

### B1. Enable Phone sign-in
1. Firebase Console → your project → **Build → Authentication → Get started**.
2. **Sign-in method** tab → enable **Phone**. Save.
3. (For testing without spending SMS, you can add a **test phone number** + code on that same screen.)

### B2. Get the Web config (frontend)
1. Project Settings (gear icon) → **General** → scroll to **Your apps**.
2. If there's no Web app, click the **`</>`** icon to register one (name it "Maaswad Web"). Skip Hosting.
3. Copy the `firebaseConfig` values:

🔑 **Save as (frontend):**
- `VITE_FIREBASE_API_KEY` = apiKey
- `VITE_FIREBASE_AUTH_DOMAIN` = authDomain
- `VITE_FIREBASE_PROJECT_ID` = projectId
- `VITE_FIREBASE_APP_ID` = appId
- `VITE_FIREBASE_MESSAGING_SENDER_ID` = messagingSenderId

### B3. Get the service account (backend)
1. Project Settings → **Service accounts** → **Generate new private key** → downloads a JSON file.
2. Open the JSON and pull out three values:

🔑 **Save as (backend):**
- `FIREBASE_PROJECT_ID` = `project_id`
- `FIREBASE_CLIENT_EMAIL` = `client_email`
- `FIREBASE_PRIVATE_KEY` = `private_key` — **the whole `-----BEGIN PRIVATE KEY-----...` string**

> ⚠️ Important: the private key contains line breaks. When you paste it into Render's env var, paste it **exactly as it is in the JSON** (with the `\n` sequences). The server converts `\n` back into real newlines automatically.

### B4. Authorize your domains (do this AFTER Part I when you know your URLs)
Authentication → **Settings → Authorized domains** → add your Cloudflare domain (e.g. `maaswad.pages.dev` and your custom domain). Without this, phone login is blocked on the live site. Note this and come back to it.

---

## Part C — Cloudinary (images)

1. Sign up at https://cloudinary.com (free tier is plenty).
2. Dashboard shows **Cloud name**, **API Key**, **API Secret**.

🔑 **Save as (backend):** `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
🔑 **Save as (frontend):** `VITE_CLOUDINARY_CLOUD_NAME` (cloud name again)

Uploads are **signed by your backend**, so the secret never reaches the browser.

---

## Part D — Resend (emails)

1. Sign up at https://resend.com.
2. **API Keys → Create API Key.**
3. **Domains:** add and verify your sending domain (add the DNS records Resend gives you). Until verified you can only send from `onboarding@resend.dev` for testing.

🔑 **Save as (backend):** `RESEND_API_KEY`, and `EMAIL_FROM` (e.g. `no-reply@yourdomain.com` once verified).

---

## Part E — Google Maps

1. Google Cloud Console → create/select a project → **APIs & Services → Enable APIs** and enable: **Maps JavaScript API**, **Places API**, **Geocoding API**, **Distance Matrix API**.
2. **Credentials → Create credentials → API key.**
3. Restrict the key (recommended): HTTP referrers for the browser key (your Cloudflare domain). You can keep one key for both for now.

🔑 **Save as (backend):** `GOOGLE_MAPS_API_KEY`
🔑 **Save as (frontend):** `VITE_GOOGLE_MAPS_KEY`

---

## Part F — Push the code to GitHub

Render and Cloudflare deploy from a Git repo.

```bash
cd "/Users/apple/Documents/Claude/Projects/Maaswad"
git init
git add .
git commit -m "Maaswad initial production build"
```

Create an empty repo on github.com (e.g. `maaswad`), then:

```bash
git remote add origin https://github.com/YOURNAME/maaswad.git
git branch -M main
git push -u origin main
```

> `.env` files are git-ignored, so your secrets are NOT pushed. You'll enter them in Render/Cloudflare dashboards instead.

---

## Part G — Deploy the Backend to Render

1. https://dashboard.render.com → **New → Web Service** → connect your GitHub repo.
2. Settings:
   - **Root Directory:** `backend`
   - **Runtime:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `node src/server.js`
   - **Health Check Path:** `/health`
   - Plan: Starter (or Free to begin).
3. **Environment variables** — add every one of these:

   | Key | Value |
   |-----|-------|
   | `NODE_ENV` | `production` |
   | `PORT` | `5000` |
   | `MONGODB_URI` | *(Part A)* |
   | `JWT_ACCESS_SECRET` | *(any long random string)* |
   | `JWT_REFRESH_SECRET` | *(another long random string)* |
   | `CLIENT_URL` | *(your Cloudflare URL — fill after Part H, e.g. `https://maaswad.pages.dev`)* |
   | `FIREBASE_PROJECT_ID` | *(Part B3)* |
   | `FIREBASE_CLIENT_EMAIL` | *(Part B3)* |
   | `FIREBASE_PRIVATE_KEY` | *(Part B3 — full key)* |
   | `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | *(Part C)* |
   | `RESEND_API_KEY` / `EMAIL_FROM` | *(Part D)* |
   | `GOOGLE_MAPS_API_KEY` | *(Part E)* |
   | `PAYMENT_PROVIDER` | `dummy` |

4. **Create Web Service.** Wait for the deploy to go green. Your API URL is like `https://maaswad-api.onrender.com`.
5. ✅ Test: open `https://maaswad-api.onrender.com/health` → should return `{ "status": "up", ... }`. Docs at `/api/docs`.

> Alternatively: Render can read the included `render.yaml` via **New → Blueprint** — then you only fill the secret values.

### Seed production data (one time, optional)
In Render → your service → **Shell**, run:
```bash
npm run seed
```
This creates the owner account and demo content. **Change/remove demo accounts before real launch.**

---

## Part H — Deploy the Frontend to Cloudflare Pages

1. https://dash.cloudflare.com → **Workers & Pages → Create → Pages → Connect to Git** → pick your repo.
2. Build settings:
   - **Framework preset:** Vite (or None)
   - **Root directory:** `frontend`
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
3. **Environment variables** (Production):

   | Key | Value |
   |-----|-------|
   | `VITE_API_URL` | `https://maaswad-api.onrender.com/api/v1` *(your Render URL + `/api/v1`)* |
   | `VITE_FIREBASE_API_KEY` … `VITE_FIREBASE_MESSAGING_SENDER_ID` | *(Part B2)* |
   | `VITE_CLOUDINARY_CLOUD_NAME` | *(Part C)* |
   | `VITE_GOOGLE_MAPS_KEY` | *(Part E)* |

4. **Save and Deploy.** You'll get a URL like `https://maaswad.pages.dev`.

---

## Part I — Connect everything (the part people forget)

1. **Render → `CLIENT_URL`** = your Cloudflare URL (e.g. `https://maaswad.pages.dev`). Save → Render redeploys. This enables CORS for your site.
2. **Firebase → Authentication → Settings → Authorized domains** = add `maaswad.pages.dev` (and any custom domain). *(Part B4)* — phone OTP fails on live without this.
3. **Google Maps key restrictions** = add your Cloudflare domain to allowed HTTP referrers.
4. **Resend** = make sure your `EMAIL_FROM` uses a verified domain.

---

## Part J — Final launch checklist

- [ ] `https://<render>/health` returns `status: up` and `db: connected`
- [ ] Open the Cloudflare site; it loads and shows dishes (after seeding)
- [ ] Phone login: real SMS arrives, code logs you in
- [ ] Place a test order end-to-end (dummy payment succeeds)
- [ ] Chef can add a dish **with an image** (confirms Cloudinary)
- [ ] An email notification arrives (confirms Resend)
- [ ] Remove or change the seeded demo accounts and set a real owner
- [ ] Add the PWA to your phone's home screen (Share → Add to Home Screen) to confirm install works

---

## When you're ready for real payments

The app ships with a **dummy gateway** (`PAYMENT_PROVIDER=dummy`). To switch to Razorpay later: add a `razorpay` provider in `backend/src/services/payment.service.js` (the structure is already there), set `PAYMENT_PROVIDER=razorpay` and the `RAZORPAY_*` keys. No other code changes needed.

---

## Quick troubleshooting

| Symptom | Fix |
|--------|-----|
| Site loads but "Network Error" | `VITE_API_URL` wrong, or Render `CLIENT_URL` doesn't match your site (CORS). |
| Phone OTP "auth/unauthorized-domain" | Add your domain in Firebase → Authorized domains (Part I.2). |
| Phone OTP "auth/invalid-app-credential" | Phone sign-in not enabled, or reCAPTCHA blocked — check Part B1. |
| Backend log "Firebase not configured" | `FIREBASE_*` env vars missing/typo'd on Render. Re-check the private key. |
| Images won't upload | `CLOUDINARY_*` not set on Render. |
| First request after idle is slow | Render free tier sleeps; first hit wakes it (~30s). Upgrade plan to avoid. |

---

*Maaswad — Home Food, Made with Mother's Love. Founded by Dr. Chef Vinoth.*
