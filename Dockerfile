# Prisma 7 requires Node 20.19+, 22.12+, or 24+
FROM node:22-alpine

WORKDIR /app

# Mirror local layout: repo root assets + backend/ (so server static path ../ works)
COPY backend/package*.json ./backend/
RUN cd backend && npm install --omit=dev

COPY backend/ ./backend/
COPY *.html *.css *.js ./

WORKDIR /app/backend

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://127.0.0.1:'+(process.env.PORT||5000)+'/api/health',(r)=>{process.exit(r.statusCode===200?0:1)}).on('error',()=>process.exit(1))"

# Use npm script so Prisma migrations run (see backend/package.json "start")
CMD ["npm", "run", "start"]
