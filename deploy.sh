#!/bin/bash

echo "🚀 Deploying Brandverse to Production"
echo "===================================="

# Check if we're in the right directory
if [ ! -f "vercel.json" ]; then
    echo "❌ Error: vercel.json not found. Please run from project root."
    exit 1
fi

echo "📦 Installing dependencies..."

# Backend dependencies
echo "Installing backend dependencies..."
cd blink/backend
npm ci --production
cd ../..

# Frontend dependencies and build
echo "Building frontend..."
cd blink/frontend
npm ci
npm run build
cd ../..

echo "✅ Build complete!"
echo ""
echo "Next steps:"
echo "1. Update your Razorpay keys in production environment"
echo "2. Update FRONTEND_URL in backend .env to your production URL"
echo "3. Deploy using: vercel --prod"
echo ""
echo "Environment variables needed in production:"
echo "- RAZORPAY_KEY_ID (production keys)"
echo "- RAZORPAY_KEY_SECRET (production keys)"
echo "- SESSION_SECRET (strong random string)"
echo "- FRONTEND_URL (your production domain)"
