#!/bin/bash

# KMRCL Metro Document Intelligence - Netlify Deployment Script

echo "🚇 Deploying KMRCL Metro Intelligence to Netlify..."
echo "=================================================="

# Check if Netlify CLI is installed
if ! command -v netlify &> /dev/null; then
    echo "📦 Installing Netlify CLI..."
    npm install -g netlify-cli
fi

# Build the application
echo "🔨 Building application for production..."
npm run build

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
else
    echo "❌ Build failed!"
    exit 1
fi

# Deploy to Netlify
echo "🚀 Deploying to Netlify..."

# Check if this is the first deployment
if [ ! -f ".netlify/state.json" ]; then
    echo "🆕 First time deployment - creating new site..."
    netlify deploy --prod --dir=dist --open
else
    echo "🔄 Updating existing deployment..."
    netlify deploy --prod --dir=dist
fi

echo ""
echo "✅ Deployment complete!"
echo "🌐 Your site should be available at your Netlify URL"
echo ""
echo "📝 Next steps:"
echo "1. Update your backend FRONTEND_URL environment variable"
echo "2. Test the connection between frontend and backend"
echo "3. Upload some documents to test the full pipeline"