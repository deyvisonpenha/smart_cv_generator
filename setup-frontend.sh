#!/bin/bash

# SmartCV Frontend Setup Script
# This script installs dependencies and configures the frontend

set -e

echo "🚀 SmartCV Frontend Setup"
echo "=========================="
echo ""

# Check if we're in the project root
if [ ! -d "frontend" ]; then
  echo "❌ Error: frontend directory not found"
  echo "Please run this script from the project root directory"
  exit 1
fi

# Navigate to frontend
cd frontend

echo "📦 Installing @rails/actioncable for WebSocket support..."
npm install @rails/actioncable

echo ""
echo "🔧 Setting up environment variables..."

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
  if [ -f ".env.example" ]; then
    echo "Creating .env.local from .env.example..."
    cp .env.example .env.local
    echo "✅ .env.local created"
  else
    echo "⚠️  Warning: .env.example not found"
    echo "Creating basic .env.local..."
    cat > .env.local << 'EOF'
# SmartCV Frontend Environment Variables
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
NEXT_PUBLIC_WS_URL=ws://localhost:3000/cable
NEXT_PUBLIC_APP_NAME=SmartCV
NEXT_PUBLIC_APP_VERSION=2.0
NEXT_PUBLIC_ENABLE_DEBUG=true
EOF
    echo "✅ .env.local created with default values"
  fi
else
  echo "✅ .env.local already exists"
fi

echo ""
echo "✅ Frontend setup complete!"
echo ""
echo "📝 Next Steps:"
echo "   1. Ensure backend is running: docker-compose up -d"
echo "   2. Start frontend dev server: cd frontend && npm run dev"
echo "   3. Open http://localhost:3001 in your browser"
echo ""
echo "📚 Documentation:"
echo "   - API Reference: API_DOCUMENTATION.md"
echo "   - Frontend Guide: FRONTEND_INTEGRATION.md"
echo "   - WebSocket Guide: ACTIONCABLE_INTEGRATION.md"
echo ""
echo "🎉 Happy coding!"
