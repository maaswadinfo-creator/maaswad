# Maaswad — Step-by-Step Setup Guide

This guide takes you from a fresh computer to a running Maaswad app (backend API + the web/PWA app). It is written so you can follow it even if you've never run code before. Allow about 15–20 minutes the first time.

> Project location on your computer:
> `/Users/apple/Documents/Claude/Projects/Maaswad`

You will end up running **two things at once**:
1. The **backend** (the API + database) on `http://localhost:5000`
2. The **frontend** (the app you click around in) on `http://localhost:5173`

---

## Part 0 — What you need to install first

You only do this section **once** on your computer.

### 0.1 Install Node.js (required)
Node.js is what runs the code.

1. Go to **https://nodejs.org**
2. Click the big button that says **"LTS"** (Long Term Support).
3. Open the downloaded file and click through the installer (keep all the default options).
4. Verify it worked: open the **Terminal** app (press `Cmd + Space`, type `Terminal`, press Enter) and type:
   ```bash
   node --version
   ```
   You should see something like `v20.x.x`. If you see a version number, you're good.

### 0.2 Get a database (required) — pick ONE option

**Option A — MongoDB Atlas (recommended, free, no install).**
1. Go to **https://www.mongodb.com/atlas** and create a free account.
2. Create a **free (M0) cluster** — accept the defaults.
3. Create a database user (a username + password) when prompted. **Write these down.**
4. Under **Network Access**, click **Add IP Address → Allow access from anywhere** (`0.0.0.0/0`).
5. Click **Connect → Drivers**, and copy the **connection string**. It looks like:
   ```
   mongodb+srv://YOURNAME:YOURPASSWORD@cluster0.xxxxx.mongodb.net/maaswad
   ```
   Replace `YOURPASSWORD` with the password from step 3, and add `/maaswad` before the `?` if it isn't there. Keep this string handy — you'll paste it in Part 1.

**Option B — Docker (if you already have Docker Desktop).**
Skip Atlas. You'll start a local database with one command in Part 1. If you don't already have Docker, use Option A instead.

---

## Part 1 — Start the Backend (API + database)

Open the **Terminal** app. Copy and paste these commands **one block at a time**, pressing Enter after each.

### 1.1 Go to the backend folder
```bash
cd "/Users/apple/Documents/Claude/Projects/Maaswad/backend"
```

### 1.2 Create your settings file
```bash
cp .env.example .env
```
This makes a file called `.env` that holds your private settings.

### 1.3 Put in your database connection (Atlas users only)
If you chose **Option A (Atlas)**, open the new `.env` file in a text editor and find this line:
```
MONGODB_URI=mongodb://localhost:27017/maaswad
```
Replace it with your Atlas connection string from step 0.2, e.g.:
```
MONGODB_URI=mongodb+srv://YOURNAME:YOURPASSWORD@cluster0.xxxxx.mongodb.net/maaswad
```
Save and close the file.

> To open the file quickly, you can run: `open -e .env` (opens it in TextEdit).

If you chose **Option B (Docker)**, leave that line as-is and, in a separate Terminal window, run:
```bash
cd "/Users/apple/Documents/Claude/Projects/Maaswad"
docker compose up mongo
```
Leave that window running.

### 1.4 Install the backend's libraries
```bash
npm install
```
This downloads everything the backend needs from the internet. It takes 1–3 minutes the first time. (This is the step that could not run in the Claude sandbox — it works normally on your own computer.)

### 1.5 Load the demo data
```bash
npm run seed
```
This fills the database with demo chefs, dishes, coupons, and test accounts. When it finishes it prints the login details — note them, and see the table in Part 3 below.

### 1.6 Start the backend
```bash
npm run dev
```
You should see `Maaswad API running on port 5000`.

**Leave this Terminal window open and running.** Closing it stops the backend.

✅ **Check it worked:** open **http://localhost:5000/api/docs** in your browser. You should see the API documentation page.

---

## Part 2 — Start the Frontend (the app)

Open a **NEW** Terminal window (`Cmd + N` in Terminal). Don't close the backend window.

### 2.1 Go to the frontend folder
```bash
cd "/Users/apple/Documents/Claude/Projects/Maaswad/frontend"
```

### 2.2 Create its settings file
```bash
cp .env.example .env
```
The default already points to your local backend, so you don't need to edit anything.

### 2.3 Install the frontend's libraries
```bash
npm install
```
Again 1–3 minutes the first time.

### 2.4 Start the app
```bash
npm run dev
```
You should see a line with `Local: http://localhost:5173/`.

✅ **Open http://localhost:5173 in your browser** — that's Maaswad.

---

## Part 3 — Log in and try it

Login uses a one-time code (OTP). **In development the code is shown right on the screen**, so you don't need real SMS or email.

1. Go to **http://localhost:5173/login**
2. Choose **Phone**, type one of the demo numbers below, click **Send OTP**.
3. The 6-digit code pops up in a toast/notification — type it in and continue.

| Who | Login | Where to go after login |
|-----|-------|--------------------------|
| **Customer** (Food Lover) | `+919000000099` | Browse on `/`, add to cart, checkout |
| **Platform Owner / Ops** | `+919000000001` | Visit `/admin` |
| **Delivery Partner** | `+919000000050` | Visit `/delivery` |
| **Home Chef** | (printed by the seed script) | Visit `/chef` |

**A full test run to try:**
1. Log in as the **customer** → add a dish to cart → checkout → place the order (dummy payment succeeds instantly).
2. In another browser tab, log in as the **chef** (`/chef`) → Orders → Accept → Start Preparing → Mark Ready.
3. Log in as the **owner** (`/admin`) → Orders → Assign Rider.
4. Log in as the **delivery partner** (`/delivery`) → move the order through to Delivered.
5. Back as the customer → confirm delivery → leave a review.

---

## Starting it again next time

You don't reinstall. Each time you want to use the app, open two Terminal windows:

**Window 1 (backend):**
```bash
cd "/Users/apple/Documents/Claude/Projects/Maaswad/backend"
npm run dev
```

**Window 2 (frontend):**
```bash
cd "/Users/apple/Documents/Claude/Projects/Maaswad/frontend"
npm run dev
```

Then open **http://localhost:5173**. To stop either one, click its Terminal window and press `Ctrl + C`.

---

## Optional — connect the real services later

The app runs fully without these. When you're ready to go live, add the keys to `backend/.env` and `frontend/.env`:

- **Resend** — sends real OTP/notification emails (`RESEND_API_KEY`).
- **Firebase** — real phone OTP + push notifications (`FIREBASE_*`).
- **Cloudinary** — image/photo uploads (`CLOUDINARY_*`).
- **Google Maps** — live distance/ETA (`GOOGLE_MAPS_API_KEY`, and `VITE_GOOGLE_MAPS_KEY` in the frontend).
- **Payments** — currently a dummy gateway. Razorpay can be added later by setting `PAYMENT_PROVIDER=razorpay` and the `RAZORPAY_*` keys.

You change pricing, fees, and commissions live inside the app at **Admin → Settings** (no code editing needed).

---

## Going live (deployment) — when you're ready

- **Backend → Render:** push this project to GitHub, then in Render "New → Blueprint" and point it at the repo (it reads `render.yaml`). Set `MONGODB_URI` and `CLIENT_URL` as environment variables in Render.
- **Frontend → Cloudflare Pages:** run `bash scripts/deploy-cloudflare.sh`, or connect the repo in Cloudflare Pages with build command `npm run build` and output folder `dist`. Set `VITE_API_URL` to your Render API URL.

---

## Troubleshooting

**"command not found: node" or "npm"** — Node.js isn't installed or the Terminal needs restarting. Redo Part 0.1, then close and reopen Terminal.

**Backend prints "MongoDB connection failed"** — your `MONGODB_URI` is wrong or the database isn't reachable. For Atlas: double-check the password in the string and that you allowed access from anywhere (step 0.2.4). For Docker: make sure the `docker compose up mongo` window is running.

**The app loads but shows no dishes / "Network Error"** — the backend isn't running, or you skipped `npm run seed`. Make sure the backend Terminal (Part 1.6) is still open and you ran the seed step.

**Login says "Request an OTP first" or code doesn't work** — request a fresh OTP; codes expire after 10 minutes.

**Port already in use** — something else is using 5000 or 5173. Close other apps/Terminals, or restart your computer.

**`npm install` fails** — check your internet connection and try again. If it mentions permissions, avoid using `sudo`; just re-run `npm install`.

---

*Maaswad — Home Food, Made with Mother's Love. Founded by Dr. Chef Vinoth.*
