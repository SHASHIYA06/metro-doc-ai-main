#!/bin/bash

# 🚀 Vercel Deployment Script for KMRCL Document Intelligence
# Author: SHASHI SHEKHAR MISHRA

echo "🚀 Starting Vercel deployment for KMRCL Document Intelligence..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel
fi

# Create vercel.json configuration
echo "📝 Creating vercel.json configuration..."
cat > vercel.json << EOF
{
  "version": 2,
  "name": "kmrcl-document-intelligence",
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "handle": "filesystem"
    },
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ],
  "buildCommand": "npm run build:prod",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "vite",
  "outputDirectory": "dist"
}
EOF

# Build the application
echo "🔨 Building application for production..."
npm run build:prod

if [ $? -ne 0 ]; then
    echo "❌ Build failed. Please fix the errors and try again."
    exit 1
fi

echo "✅ Build successful!"

# Login to Vercel (if not already logged in)
echo "🔐 Checking Vercel authentication..."
vercel whoami > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "Please login to Vercel:"
    vercel login
fi

# Deploy to Vercel
echo "🌐 Deploying to Vercel..."
vercel --prod

if [ $? -eq 0 ]; then
    echo "🎉 Deployment successful!"
    echo ""
    echo "📋 Next steps:"
    echo "1. Set environment variables in Vercel dashboard or use CLI:"
    echo "   vercel env add VITE_API_BASE_URL"
    echo "   vercel env add VITE_APP_NAME"
    echo "   vercel env add VITE_ENABLE_DEBUG"
    echo ""
    echo "2. Example environment variables:"
    echo "   VITE_API_BASE_URL=https://your-backend-url.onrender.com"
    echo "   VITE_APP_NAME=KMRCL Metro Document Intelligence"
    echo "   VITE_ENABLE_DEBUG=false"
    echo ""
    echo "3. Redeploy after setting environment variables:"
    echo "   vercel --prod"
    echo ""
    echo "4. Test your application and configure custom domain if needed"
else
    echo "❌ Deployment failed. Please check the errors above."
    exit 1
fi