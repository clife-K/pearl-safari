# Lecturer Setup Guide (Run from Zipped Folder)

This guide explains how to run the project on a different laptop after receiving the zipped folder.

## 1) Requirements

Install these first:

- Node.js (LTS, version 18 or newer): [https://nodejs.org](https://nodejs.org)
- PostgreSQL (version 14 or newer): [https://www.postgresql.org/download/](https://www.postgresql.org/download/)

Verify installation in terminal:

```bash
node -v
npm -v
psql --version
```

## 2) Unzip the Project

1. Extract the zip file (for example to `Desktop/E-commerce`).
2. Open terminal in the extracted `E-commerce` folder.

## 3) Create Database

Open PostgreSQL terminal (`psql`) and run:

```sql
CREATE DATABASE pearl_safari_db;
```

## 4) Configure Environment File

1. Go to `backend` folder.
2. Create `.env` file in `backend`.
3. Paste this (edit username/password if needed):

```env
DATABASE_URL="postgresql://postgres:YOUR_POSTGRES_PASSWORD@localhost:5432/pearl_safari_db"
NODE_ENV=development
PORT=5000
JWT_SECRET="change-this-to-any-random-long-string"
FRONTEND_URL="http://localhost:3000"
```

## 5) Install Dependencies and Prepare Database

From `backend` folder:

```bash
npm install
npx prisma migrate deploy
npm run seed
```

## 6) Start Backend

Still in `backend` folder:

```bash
npm run dev
```

Expected output should include:

- API running on `http://localhost:5000`

Keep this terminal open.

## 7) Start Frontend (New Terminal)

Open a second terminal in the project root (`E-commerce`) and run one of:

```bash
python -m http.server 3000
```

or

```bash
npx http-server -p 3000
```

Then open:

- `http://localhost:3000`

## 8) Quick Test Checklist

1. Home page loads.
2. Destinations and Packages pages load.
3. User can sign up/login.
4. Booking page can submit booking.
5. Contact page can submit message.

## 9) Admin Access (Optional)

Open:

- `http://localhost:3000/admin-login.html`

If there is no admin user yet, create one from `backend`:

```bash
node create-admin.js
```

Then login with the credentials printed/expected by the script.

## 10) Common Issues and Fixes

- **Port already in use (3000 or 5000)**  
  Stop the process using that port, or run frontend on another port (e.g. 3001).

- **Database connection error**  
  Check `DATABASE_URL` in `backend/.env` and confirm PostgreSQL service is running.

- **Prisma migration/seed fails**  
  Confirm database exists (`pearl_safari_db`) and user has permission.

- **`npm` or `node` command not found**  
  Reinstall Node.js and reopen terminal.

## 11) What to Submit with Zip

When sending the zip, include:

- Full project folder (with `backend`, HTML files, CSS, JS)
- `LECTURER_SETUP_GUIDE.md` (this file)
- `README.md`

Do not include:

- `backend/node_modules`
- `backend/.env`

---

If these steps are followed in order, the system should run locally without additional configuration.
