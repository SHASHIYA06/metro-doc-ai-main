#!/bin/bash

# Deploy KMRCL Metro Document Intelligence to Vercel
echo "🚀 Deploying KMRCL Metro Document Intelligence to Vercel..."

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

# Build the application
echo "📦 Building application..."
npm run build

# Deploy to Vercel
echo "🌐 Deploying to Vercel..."
vercel --prod

echo "✅ Deployment complete!"
echo "🔗 Your application should be available at: https://metro-doc-ai-main.vercel.app"
echo ""
echo "📋 Next steps:"
echo "1. Set environment variables in Vercel dashboard:"
echo "   - VITE_API_BASE_URL=https://metro-doc-ai-main-production.up.railway.app"
echo "   - VITE_APP_SCRIPT_URL=https://script.google.com/macros/s/AKfycbzq7-DRXeX5dbcCAXfSqDgjubDAWkTiHOMdZ1PLaCdknrPkKfbo5znLvntYN7lICzz_mQ/exec"
echo "   - VITE_APP_NAME=KMRCL Metro Document Intelligence"
echo "   - VITE_APP_VERSION=2.0.0"
echo "2. Deploy backend to Railway"
echo "3. Test the complete application"