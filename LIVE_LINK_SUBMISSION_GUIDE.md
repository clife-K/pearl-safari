# Live Link Submission Guide (For Lecturer Marking)

This guide helps you publish one working link so your lecturer can test from anywhere.

## Goal

Publish the project online with:

- Public website URL
- Working backend API
- Online PostgreSQL database
- Test credentials for lecturer

## Recommended Setup (Fastest)

- Host backend + database on Railway
- Serve frontend from same app (already supported by `backend/server.js`)

This avoids CORS and cross-domain issues.

## Step 1: Push Project to GitHub

1. Create a new GitHub repository.
2. Upload this project.
3. Confirm repository includes:
   - `backend/`
   - HTML/CSS/JS files in root
   - `railway.json`
4. Confirm repository does NOT include:
   - `backend/.env`
   - `backend/node_modules`

## Step 2: Deploy on Railway

1. Go to [https://railway.app](https://railway.app)
2. New Project -> Deploy from GitHub repo
3. Add PostgreSQL service to same project
4. Open app service -> Variables and set:

```env
NODE_ENV=production
JWT_SECRET=put-a-long-random-secret-here
FRONTEND_URL=https://YOUR-RAILWAY-APP-DOMAIN
```

Do not set `DATABASE_URL` manually if Railway already injects it from PostgreSQL service.

## Step 3: First Deployment Check

After deploy completes, open:

- `https://YOUR-RAILWAY-APP-DOMAIN/api/health`

Expected:

- JSON response with `ok: true`

If health endpoint fails:

- check Railway logs
- verify PostgreSQL service is attached
- verify `JWT_SECRET` exists

## Step 4: Seed Initial Data

In Railway service shell/console, run:

```bash
cd backend
npm run seed
node create-admin.js
```

This creates sample data and admin account.

## Step 5: End-to-End Test (Before Sharing)

Test these in live site:

1. Homepage loads
2. Signup/Login works
3. Destinations and packages load
4. Booking can be created
5. Contact form submits
6. Admin login works (`/admin-login.html`)

## Step 6: Send Lecturer This Exact Format

Copy and send:

```text
Project: Pearl Safari Uganda (Commercial Website)
Live URL: https://YOUR-RAILWAY-APP-DOMAIN
Admin URL: https://YOUR-RAILWAY-APP-DOMAIN/admin-login.html

Test User Account
Email: testuser@example.com
Password: Test@12345

Admin Account
Email: admin@pearlsafari.ug
Password: (the one created during setup)

Features to Test
1) User signup/login
2) Browse destinations and packages
3) Create booking
4) Submit contact message
5) Admin dashboard (bookings, payments, messages, users)
```

## Scoring Protection Tips

- Deploy at least 24 hours before deadline
- Keep backup demo video (2-3 minutes)
- Re-test link from phone mobile data (not your Wi-Fi)
- Do not change env vars after final test

---

If Railway has an outage, deploy the same repo to Render as fallback and share both links.
