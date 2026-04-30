# Pearl Safari Uganda ✨

A premium e-commerce platform for booking wildlife safaris and travel experiences in Uganda.

## Features

- 🦁 **Destination Browsing** - Explore beautiful locations across Uganda
- 📦 **Package Management** - View and book curated tour packages
- 👤 **User Authentication** - Secure signup/login with JWT
- 📅 **Booking System** - Complete booking workflow
- 💳 **Payment Integration** - Multiple payment methods
- 📱 **Responsive Design** - Works on all devices
- 🎨 **Premium UI** - Luxury safari aesthetic

## Tech Stack

### Frontend
- HTML5
- CSS3 (Custom, no frameworks)
- Vanilla JavaScript
- Font Awesome Icons

### Backend
- Node.js + Express.js
- PostgreSQL Database
- Prisma ORM
- JWT Authentication
- bcrypt (Password hashing)

## Project Structure

```
E-commerce/
├── frontend/              # Static site (HTML, CSS, JS)
│   └── images/            # Optional local safari photos (.gitkeep only until you add files)
├── backend/
│   ├── server.js          # Express API + serves frontend/
│   ├── routes/            # Admin API routes
│   ├── resolve-database-url.cjs
│   ├── prisma.config.ts
│   └── prisma/
│       ├── schema.prisma
│       └── migrations/
├── railway-web-vars.txt   # Starter Railway variables (copy into dashboard)
├── DEPLOYMENT.md
├── docker-compose.yml
├── Dockerfile
└── railway.json
```

## Quick Start

### Local Development

**Prerequisites**: Node.js **20.19+** (22 LTS recommended), PostgreSQL 14+

```bash
# 1. Create DB & configure backend/.env (copy from backend/.env.example)
createdb pearl_safari_db

# 2. Install, migrate, seed, run (single process serves UI + API)
cd backend
npm install
npx prisma migrate deploy
npm run seed
npm run dev
```

Open **`http://localhost:5000`** (same server powers `/api` and the pages under **`frontend/`**).

**Optional split dev**: serve only API from `backend` and open `frontend/` with another static server on port 3000 (`api-config.js` maps localhost:3000 → API :5000).

### Safari photos

Place JPG/JPEG files referenced in pages under **`frontend/images/`** (see `<img src="images/...">` in HTML). Until then, some thumbnails may 404; the site still runs.

### Prisma Client / Postgres auth

- **`Cannot find module '.prisma/client/default'`** → from `backend` run **`npx prisma generate`** (or **`npm install`**, which now runs **`prisma generate` on postinstall**).
- **`P1000` authentication failed / `pearl_user`** → your **`DATABASE_URL` in `backend/.env`** does not match Postgres. Use Windows superuser **`postgres`** plus the password you set at install (**see `backend/.env.example`**), **or** create `pearl_user` and matching password in Postgres. Prisma prefers **Node 22 LTS**; **Node 25** may show engine warnings.

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Create new account
- `POST /api/auth/login` - Login user

### Destinations
- `GET /api/destinations` - List all destinations

### Packages
- `GET /api/packages` - List all packages

### Bookings
- `POST /api/bookings` - Create booking
- `GET /api/bookings/me` - Get user bookings

### Payments
- `POST /api/bookings/:id/payments` - Process payment

### System
- `GET /api/health` - Health check
- `GET /api/config` - Frontend config

## Environment Variables

Create `backend/.env`:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/pearl_safari_db
NODE_ENV=development
PORT=5000
JWT_SECRET=your-secret-key-here
FRONTEND_URL=http://localhost:3000
```

## Deployment

### Quick Deploy to Railway (Recommended)

1. Push code to GitHub
2. Go to [railway.app](https://railway.app)
3. Create new project, connect repo
4. Add **PostgreSQL** in the **same project**
5. On your **Web / Docker service** → **Variables** → Raw Editor: paste **`railway-web-vars.txt`**, then fix **`DATABASE_URL`** using Railway’s variable reference / autocomplete so it points at **your** Postgres tile (slug may not be `Postgres`). Set **`JWT_SECRET`**. Deploy.

**If deployments loop with “DATABASE_URL is not available”, Postgres variables are not referenced on the web service yet.**

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed guides for:
- Railway
- Heroku
- Render
- DigitalOcean
- Docker

## Database Schema

### Key Tables
- **users** - User accounts with authentication
- **destinations** - Safari destinations
- **tour_packages** - Curated tour offerings
- **bookings** - Customer bookings
- **payments** - Payment records

Run `npx prisma studio` to view database visually.

## Security Features

- ✅ JWT-based authentication (7-day expiry)
- ✅ Bcrypt password hashing (10 rounds)
- ✅ CORS protection
- ✅ Environment variable isolation
- ✅ Input validation on backend
- ✅ Secure payment processing flow

## Development

### Running Tests
```bash
npm test
```

### Database Operations
```bash
# View database in Prisma Studio
npx prisma studio

# Create migration
npx prisma migrate dev --name add_new_table

# Reset database (⚠️ WARNING: Deletes all data)
npx prisma migrate reset
```

## Troubleshooting

**Backend won't start**
```bash
# Check if port 5000 is in use
lsof -i :5000
kill -9 <PID>
```

**Database connection error**
```bash
# Verify PostgreSQL is running and DATABASE_URL is correct
psql $DATABASE_URL
```

**Frontend can't reach API**
```bash
# Check backend is running and accessible
curl http://localhost:5000/api/health
```

## Contributing

1. Create feature branch: `git checkout -b feature/amazing-feature`
2. Commit changes: `git commit -m 'Add amazing feature'`
3. Push to branch: `git push origin feature/amazing-feature`
4. Open Pull Request

## License

Proprietary - Pearl Safari Uganda

## Contact

- **Email**: info@pearlsafari.ug
- **Phone**: +256 700 123 456
- **Location**: Kampala, Uganda

---

**Last Updated**: April 2026  
**Version**: 1.0.0  
**Status**: Production Ready ✨
