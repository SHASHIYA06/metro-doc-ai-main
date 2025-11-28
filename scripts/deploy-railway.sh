#!/bin/bash

# Deploy KMRCL Metro Document Intelligence Backend to Railway
echo "🚂 Deploying KMRCL Metro Document Intelligence Backend to Railway..."

# Check if railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Please install it first:"
    echo "npm install -g @railway/cli"
    echo "or visit: https://railway.app/cli"
    exit 1
fi

# Navigate to backend directory
cd backend

# Login to Railway (if not already logged in)
echo "🔐 Checking Railway authentication..."
railway login

# Deploy to Railway
echo "🌐 Deploying backend to Railway..."
railway up

echo "✅ Backend deployment complete!"
echo "🔗 Your backend should be available at: https://metro-doc-ai-main-production.up.railway.app"
echo ""
echo "📋 Next steps:"
echo "1. Set environment variables in Railway dashboard:"
echo "   - NODE_ENV=production"
echo "   - GEMINI_API_KEY=your_actual_gemini_api_key"
echo "   - FRONTEND_URL=https://metro-doc-ai-main.vercel.app"
echo "2. Test backend health: https://metro-doc-ai-main-production.up.railway.app/health"
echo "3. Update frontend environment variables to point to Railway backend"