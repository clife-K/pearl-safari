#!/bin/bash
# Pearl Safari Uganda - Local Setup Script
# This script automates the local development setup

set -e

echo "🦁 Pearl Safari Uganda - Setup Script"
echo "======================================"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not installed. Please install Node.js 16+"
    exit 1
fi
echo "✅ Node.js $(node --version) found"

# Check PostgreSQL
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL not installed. Please install PostgreSQL 12+"
    exit 1
fi
echo "✅ PostgreSQL found"

# Setup backend
echo ""
echo "📦 Installing backend dependencies..."
cd backend
npm install
echo "✅ Backend dependencies installed"

# Setup environment
if [ ! -f .env ]; then
    echo ""
    echo "⚙️  Creating .env file..."
    cat > .env << 'EOF'
DATABASE_URL="postgresql://localhost/pearl_safari_db"
PORT=5000
NODE_ENV=development
JWT_SECRET="pearl-safari-development-secret-key-2026"
FRONTEND_URL="http://localhost:3000"
EOF
    echo "✅ .env created - Update DATABASE_URL with your PostgreSQL credentials"
fi

# Create database
echo ""
echo "🗄️  Creating PostgreSQL database..."
if psql -U postgres -c "SELECT 1 FROM pg_database WHERE datname = 'pearl_safari_db'" | grep -q 1; then
    echo "✅ Database 'pearl_safari_db' already exists"
else
    createdb pearl_safari_db -U postgres || true
    echo "✅ Database 'pearl_safari_db' created"
fi

# Migrate database
echo ""
echo "📋 Running database migrations..."
npx prisma migrate deploy
echo "✅ Database migrated"

# Optional seed
read -p "Do you want to seed sample data? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    npm run seed
    echo "✅ Sample data seeded"
fi

echo ""
echo "======================================"
echo "✨ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Terminal 1: cd backend && npm run dev"
echo "2. Terminal 2: python -m http.server 3000"
echo "3. Open http://localhost:3000"
echo ""
echo "Happy coding! 🚀"
