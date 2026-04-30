# Prisma 7 requires Node 20.19+, 22.12+, or 24+
FROM node:22-alpine

WORKDIR /app

COPY backend/ ./backend/
COPY frontend/ ./frontend/

WORKDIR /app/backend

RUN npm install --omit=dev

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://127.0.0.1:'+(process.env.PORT||5000)+'/api/health',(r)=>{process.exit(r.statusCode===200?0:1)}).on('error',()=>process.exit(1))"

CMD ["npm", "run", "start"]
