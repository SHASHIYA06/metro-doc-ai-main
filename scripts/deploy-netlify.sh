#!/bin/bash

# 🚀 Netlify Deployment Script for KMRCL Document Intelligence
# Author: SHASHI SHEKHAR MISHRA

echo "🚀 Starting Netlify deployment for KMRCL Document Intelligence..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

# Check if Netlify CLI is installed
if ! command -v netlify &> /dev/null; then
    echo "📦 Installing Netlify CLI..."
    npm install -g netlify-cli
fi

# Build the application
echo "🔨 Building application for production..."
npm run build:prod

if [ $? -ne 0 ]; then
    echo "❌ Build failed. Please fix the errors and try again."
    exit 1
fi

echo "✅ Build successful!"

# Check if netlify.toml exists
if [ ! -f "netlify.toml" ]; then
    echo "📝 Creating netlify.toml configuration..."
    cat > netlify.toml << EOF
[build]
  publish = "dist"
  command = "npm run build:prod"

[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/static/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "/*.js"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "/*.css"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
EOF
fi

# Deploy to Netlify
echo "🌐 Deploying to Netlify..."
netlify deploy --prod --dir=dist

if [ $? -eq 0 ]; then
    echo "🎉 Deployment successful!"
    echo "📋 Next steps:"
    echo "   1. Set environment variables in Netlify dashboard:"
    echo "      - VITE_API_BASE_URL (your backend URL)"
    echo "      - VITE_APP_NAME=KMRCL Metro Document Intelligence"
    echo "      - VITE_ENABLE_DEBUG=false"
    echo "   2. Test your application"
    echo "   3. Configure custom domain if needed"
else
    echo "❌ Deployment failed. Please check the errors above."
    exit 1
fi