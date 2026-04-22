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
├── frontend files (HTML, CSS, JS)
├── backend/
│   ├── server.js          # Main Express server
│   ├── package.json       # Dependencies
│   ├── .env              # Environment config
│   └── prisma/
│       ├── schema.prisma # Database schema
│       └── migrations/   # DB migrations
├── DEPLOYMENT.md         # Deployment guide
├── docker-compose.yml    # Docker setup
└── Dockerfile           # Container image
```

## Quick Start

### Local Development

**Prerequisites**: Node.js 16+, PostgreSQL 12+

```bash
# 1. Install backend dependencies
cd backend
npm install

# 2. Create PostgreSQL database
createdb pearl_safari_db

# 3. Configure environment
# Edit backend/.env with your database URL

# 4. Initialize database
npm run seed

# 5. Start backend (Terminal 1)
npm run dev

# 6. Start frontend (Terminal 2)
# Use any HTTP server:
python -m http.server 3000
# or
npx http-server -p 3000
```

Access at: `http://localhost:3000`

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
4. Add PostgreSQL service
5. Set environment variables
6. Deploy!

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
