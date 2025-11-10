#!/bin/bash

# 🚀 Render Backend Deployment Script for KMRCL Document Intelligence
# Author: SHASHI SHEKHAR MISHRA

echo "🚀 Preparing backend for Render deployment..."

# Check if we're in the backend directory
if [ ! -f "backend/package.json" ]; then
    echo "❌ Error: backend/package.json not found. Please ensure backend directory exists."
    exit 1
fi

cd backend

# Verify package.json has correct configuration
echo "🔍 Verifying backend configuration..."

# Check if start script exists
if ! grep -q '"start".*"node server.js"' package.json; then
    echo "📝 Adding start script to package.json..."
    # Use node to modify package.json
    node -e "
    const fs = require('fs');
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    pkg.scripts = pkg.scripts || {};
    pkg.scripts.start = 'node server.js';
    pkg.engines = pkg.engines || {};
    pkg.engines.node = '>=18.0.0';
    fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
    "
fi

# Check if .env.example exists and create deployment notes
if [ ! -f ".env.example" ]; then
    echo "📝 Creating .env.example for Render deployment..."
    cat > .env.example << EOF
# KMRCL Backend Environment Variables for Render

# Gemini AI API Key (Required)
GEMINI_API_KEY=AIzaSyDhOJhJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJ

# Server Configuration
NODE_ENV=production
PORT=3000

# Frontend URL (for CORS) - Update after frontend deployment
FRONTEND_URL=https://your-frontend-url.netlify.app

# Optional: Database URLs (if using external storage)
# DATABASE_URL=postgresql://...
# REDIS_URL=redis://...
EOF
fi

# Create render.yaml for easier deployment
echo "📝 Creating render.yaml configuration..."
cat > render.yaml << EOF
services:
  - type: web
    name: kmrcl-backend
    env: node
    plan: starter
    buildCommand: npm install
    startCommand: npm start
    healthCheckPath: /health
    envVars:
      - key: NODE_ENV
        value: production
      - key: GEMINI_API_KEY
        sync: false  # Set manually in Render dashboard
      - key: FRONTEND_URL
        sync: false  # Set manually in Render dashboard
EOF

# Test the server locally first
echo "🧪 Testing server configuration..."
if command -v node &> /dev/null; then
    echo "✅ Node.js is available"
    
    # Check if all dependencies are installed
    if [ ! -d "node_modules" ]; then
        echo "📦 Installing dependencies..."
        npm install
    fi
    
    # Quick syntax check
    node -c server.js
    if [ $? -eq 0 ]; then
        echo "✅ Server syntax is valid"
    else
        echo "❌ Server syntax error. Please fix before deploying."
        exit 1
    fi
else
    echo "⚠️ Node.js not found. Please ensure Node.js 18+ is installed."
fi

cd ..

echo "🎉 Backend is ready for Render deployment!"
echo ""
echo "📋 Deployment Instructions:"
echo "1. Go to https://render.com and create a new Web Service"
echo "2. Connect your GitHub repository"
echo "3. Use these settings:"
echo "   - Name: kmrcl-backend"
echo "   - Environment: Node"
echo "   - Root Directory: backend"
echo "   - Build Command: npm install"
echo "   - Start Command: npm start"
echo "   - Health Check Path: /health"
echo ""
echo "4. Set these environment variables in Render dashboard:"
echo "   - GEMINI_API_KEY=your_actual_gemini_api_key"
echo "   - NODE_ENV=production"
echo "   - FRONTEND_URL=your_frontend_url_after_deployment"
echo ""
echo "5. Deploy and test the /health endpoint"
echo ""
echo "📄 Configuration files created:"
echo "   - backend/.env.example"
echo "   - backend/render.yaml"