# Pearl Safari Uganda - Deployment Guide

## ✅ Project Status
This is a full-stack e-commerce travel booking application:
- **Frontend**: Static HTML/CSS/JavaScript
- **Backend**: Node.js + Express + PostgreSQL + Prisma ORM
- **Authentication**: JWT + bcrypt
- **Status**: Production-ready with dynamic API configuration

---

## 🚀 Quick Start - Local Development

### Prerequisites
- Node.js 16+ 
- PostgreSQL 12+
- npm or yarn

### Setup Backend

```bash
cd backend
npm install

# Create PostgreSQL database
createdb pearl_safari_db

# Initialize database with Prisma
npm run seed
```

### Environment Configuration
Edit `backend/.env`:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/pearl_safari_db"
PORT=5000
JWT_SECRET="your-secret-key-here"
NODE_ENV=development
FRONTEND_URL="http://localhost:3000"
```

### Run Locally
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend (use any http server)
# Option A: Python
python -m http.server 3000

# Option B: Node.js (http-server)
npx http-server -p 3000

# Option C: VS Code Live Server extension
```

Access at: `http://localhost:3000`

---

## 🌐 Deployment Options

### Option 1: Railway (Recommended - Free Tier Available)

**Best for**: Full-stack apps with database

1. **Create Railway Account**
   - Go to [railway.app](https://railway.app)
   - Sign up with GitHub

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub"
   - Connect your repository

3. **Add PostgreSQL Service**
   - In Railway dashboard, click "+"
   - Select "PostgreSQL"
   - Railway auto-links DATABASE_URL

4. **Configure Node Service**
   - Select your GitHub repo
   - Set Environment Variables:
     ```
     NODE_ENV=production
     PORT=3000
     JWT_SECRET=your-strong-secret-key
     FRONTEND_URL=https://your-domain.railway.app
     ```

5. **Deploy**
   - Railway auto-detects Node.js
   - Runs `npm install` and `npm start` automatically
   - Domain assigned automatically

---

### Option 2: Heroku

**Prerequisites**: Heroku CLI installed

```bash
# Login to Heroku
heroku login

# Create new app
heroku create pearl-safari-ug

# Add PostgreSQL
heroku addons:create heroku-postgresql:hobby-dev

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET="your-secret-key"

# Deploy (from backend folder)
cd backend
git push heroku main

# Seed database (if needed)
heroku run npm run seed

# View logs
heroku logs --tail
```

---

### Option 3: Render

1. **Push code to GitHub**
2. Go to [render.com](https://render.com)
3. Click "New +" → "Web Service"
4. Connect GitHub repository
5. Configure:
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Environment Variables**:
     ```
     NODE_ENV=production
     JWT_SECRET=your-secret-key
     ```
6. Connect PostgreSQL database
7. Deploy

---

### Option 4: DigitalOcean App Platform

1. **Connect GitHub** to DigitalOcean
2. **Create new app**
3. **Select repository** → backend folder
4. **Configure**:
   - Runtime: Node.js
   - Build: `npm install`
   - Run: `npm start`
5. **Add PostgreSQL database**
6. **Deploy**

---

## 📦 Production Checklist

### Backend (server.js)
- ✅ CORS configured with FRONTEND_URL
- ✅ Static file serving enabled
- ✅ Database migrations run
- ✅ Environment variables set
- ✅ Error handling in place
- ✅ JWT_SECRET is strong (not "replace-me")

### Frontend
- ✅ API_BASE dynamically loaded from `/api/config`
- ✅ Authentication tokens stored securely
- ✅ No localhost hardcoded URLs
- ✅ Error handling for API failures

### Database
- ✅ PostgreSQL instance provisioned
- ✅ DATABASE_URL environment variable set
- ✅ Migrations applied: `npx prisma migrate deploy`
- ✅ Regular backups enabled

### Security
- ✅ HTTPS enabled (automatic on Railway/Render/Heroku)
- ✅ Strong JWT_SECRET (min 32 characters)
- ✅ CORS restricted to your domain
- ✅ No credentials in code (use .env)
- ✅ No console.log of sensitive data

---

## 🔧 Common Issues & Fixes

### "Cannot connect to database"
```bash
# Verify DATABASE_URL format
# postgresql://user:password@host:5432/dbname

# Test connection
psql postgresql://user:password@host:5432/dbname
```

### "API endpoints return 404"
- Ensure frontend is using `/api/` prefix
- Check CORS settings in server.js
- Verify backend is running

### "Login not working"
- Check JWT_SECRET is set in both local and production
- Verify token is sent in Authorization header
- Check database has users table

### "Database migrations fail"
```bash
# Reset database (⚠️ Deletes all data)
npx prisma migrate reset

# Or manually create tables from schema
npx prisma db push
```

---

## 📊 Monitoring & Logs

### Railway
- Logs visible in dashboard in real-time
- Check "Deployments" tab for build logs

### Heroku
```bash
heroku logs --tail
```

### Render
- Logs in dashboard under "Logs" tab
- Can download deployment logs

---

## 🔄 Continuous Deployment

All platforms support automatic deployment:
- **Push to main branch** → Automatic build & deploy
- Rollback available if deployment fails
- Environment variables persist across deployments

---

## 💾 Database Backups

### Railway
- Automatic daily backups included

### Heroku
```bash
# Manual backup
heroku pg:backups:capture

# Download backup
heroku pg:backups:url
```

### Render
- Automatic backups (check Render dashboard)

---

## 🎯 Next Steps After Deployment

1. **Get your domain URL** from deployment platform
2. **Update DNS** if using custom domain
3. **Test all features**:
   - Signup/Login
   - Destinations loading from API
   - Booking creation
   - Payment processing
4. **Monitor logs** for errors
5. **Set up email notifications** for alerts

---

## 📞 Support

For issues:
1. Check deployment platform logs
2. Verify .env variables match production
3. Test API manually: `curl https://your-domain/api/health`
4. Check database connection: `psql [DATABASE_URL]`

---

**Last Updated**: April 22, 2026
**App Version**: 1.0.0
