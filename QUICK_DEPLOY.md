# Pearl Safari Uganda - Quick Deployment Checklist

## Pre-Deployment

- [ ] Git repository created and code pushed
- [ ] All API endpoints tested locally
- [ ] Database migrations verified
- [ ] Frontend API base URL is dynamic (using /api/config)
- [ ] No hardcoded localhost URLs remaining
- [ ] .env files not committed to git
- [ ] README.md and DEPLOYMENT.md created

## Database Setup

- [ ] PostgreSQL instance provisioned
- [ ] Database created
- [ ] Prisma migrations applied
- [ ] DATABASE_URL copied to deployment platform
- [ ] Backup strategy enabled

## Environment Variables

**Must set on deployment platform:**

```
NODE_ENV=production
PORT=3000 (or auto-assigned)
DATABASE_URL=postgresql://...
JWT_SECRET=<strong-random-key-min-32-chars>
FRONTEND_URL=https://your-domain
```

## Deployment Platforms Quick Links

### Railway
1. Sign up: https://railway.app
2. Connect GitHub
3. Add PostgreSQL service
4. Deploy
5. Domain: Assigned automatically

### Heroku
1. Create: `heroku create app-name`
2. Add DB: `heroku addons:create heroku-postgresql:hobby-dev`
3. Push: `git push heroku main`
4. Seed: `heroku run npm run seed`

### Render
1. Go to: https://render.com
2. Connect GitHub
3. Create web service
4. Add PostgreSQL database
5. Deploy

### DigitalOcean
1. Go to: https://www.digitalocean.com
2. Create app
3. Connect GitHub
4. Configure Node.js runtime
5. Add database
6. Deploy

## Post-Deployment Testing

- [ ] Health check: `GET /api/health` returns 200
- [ ] API config: `GET /api/config` returns correct URL
- [ ] Signup: Create test account
- [ ] Login: Test authentication
- [ ] Destinations: API loading data
- [ ] Booking: Full flow works
- [ ] Payment: Can process payment
- [ ] Check deployment logs for errors

## Frontend Custom Domain

1. **Get domain**: Namecheap, GoDaddy, etc.
2. **Point DNS** to deployment platform's nameservers
3. **Wait 24-48 hours** for DNS propagation
4. **HTTPS**: Automatic on Railway/Render/Heroku

## Monitoring

- [ ] Set up error notifications
- [ ] Monitor database performance
- [ ] Check logs regularly
- [ ] Set up uptime monitoring (Uptime Robot)
- [ ] Database backup schedule confirmed

## Scaling (When Needed)

- Scale backend: Upgrade dyno/machine type
- Scale database: Increase storage, upgrade tier
- Add caching: Redis for sessions
- CDN: Cloudflare for static files

## Rollback Plan

- [ ] Keep previous version accessible
- [ ] Know how to redeploy previous commit
- [ ] Database backups available
- [ ] Rollback tested before production push

## Common Variables by Platform

### Railway
```
RAILWAY_ENVIRONMENT_ID=env_xxx
```

### Heroku
```
DYNO_TYPE=eco
```

### Render
```
RENDER_DEPLOY_TO=service_xxx
```

---

## Success Indicators

✅ Backend running: `https://app-domain/api/health` → 200  
✅ Frontend loads: `https://app-domain` → Homepage  
✅ Can create account: Signup successful  
✅ Can login: JWT token received  
✅ API requests work: Destinations/packages loading  
✅ Database persists: Data survives restart  
✅ No errors in logs: Clean deployment  

---

## Emergency Contacts & Resources

- **Railway Support**: support@railway.app
- **Heroku Support**: help.heroku.com
- **PostgreSQL Docs**: postgresql.org/docs
- **Prisma Docs**: prisma.io/docs
- **Node.js Docs**: nodejs.org/docs

---

**Deployment Time**: ~15-30 minutes  
**First Test**: Run health check immediately after deploy  
**Next Steps**: Monitor logs, test features, add analytics  
