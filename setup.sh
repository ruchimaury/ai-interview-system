#!/bin/bash

echo ""
echo "=========================================="
echo "  🤖 AI Interview Screening System Setup"
echo "=========================================="
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js 18+ from https://nodejs.org"
    exit 1
fi

NODE_VERSION=$(node -v)
echo "✅ Node.js found: $NODE_VERSION"

# Check MongoDB
if ! command -v mongod &> /dev/null && ! command -v mongo &> /dev/null; then
    echo "⚠️  MongoDB not found locally. Make sure MongoDB is running."
    echo "   Install: https://www.mongodb.com/try/download/community"
fi

echo ""
echo "📦 Installing Backend dependencies..."
cd backend && npm install
if [ $? -ne 0 ]; then echo "❌ Backend install failed"; exit 1; fi
echo "✅ Backend dependencies installed"

echo ""
echo "📦 Installing Frontend dependencies..."
cd ../frontend && npm install
if [ $? -ne 0 ]; then echo "❌ Frontend install failed"; exit 1; fi
echo "✅ Frontend dependencies installed"

echo ""
echo "=========================================="
echo "  ✅ Setup Complete!"
echo "=========================================="
echo ""
echo "To run the project:"
echo ""
echo "  Terminal 1 (Backend):"
echo "    cd ai-interview-system/backend"
echo "    npm run dev    (or: npm start)"
echo ""
echo "  Terminal 2 (Frontend):"
echo "    cd ai-interview-system/frontend"
echo "    npm start"
echo ""
echo "  Browser: http://localhost:3000"
echo ""
echo "  Create Admin Account:"
echo "    POST http://localhost:5000/api/auth/create-admin"
echo "    Body: { name, email, password, adminSecret: 'ADMIN_SECRET_2024' }"
echo ""
echo "  Or use ThunderClient / Postman to create admin"
echo ""
