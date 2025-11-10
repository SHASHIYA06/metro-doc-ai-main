#!/bin/bash

# 🚀 Production Setup Script for KMRCL Document Intelligence
# Author: SHASHI SHEKHAR MISHRA
# This script prepares the application for production deployment

echo "🚀 Setting up KMRCL Document Intelligence for production deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️ $1${NC}"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the project root."
    exit 1
fi

print_info "Checking project structure..."

# Verify essential files exist
essential_files=(
    "package.json"
    "vite.config.ts"
    "src/components/SimpleAISearch.tsx"
    "backend/server.js"
    "backend/package.json"
)

for file in "${essential_files[@]}"; do
    if [ -f "$file" ]; then
        print_status "$file exists"
    else
        print_error "$file is missing!"
        exit 1
    fi
done

# Check Node.js version
print_info "Checking Node.js version..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    print_status "Node.js version: $NODE_VERSION"
    
    # Extract major version number
    MAJOR_VERSION=$(echo $NODE_VERSION | cut -d'.' -f1 | sed 's/v//')
    if [ "$MAJOR_VERSION" -lt 18 ]; then
        print_warning "Node.js 18+ is recommended. Current version: $NODE_VERSION"
    fi
else
    print_error "Node.js is not installed!"
    exit 1
fi

# Install dependencies
print_info "Installing frontend dependencies..."
npm install
if [ $? -eq 0 ]; then
    print_status "Frontend dependencies installed"
else
    print_error "Failed to install frontend dependencies"
    exit 1
fi

print_info "Installing backend dependencies..."
cd backend
npm install
if [ $? -eq 0 ]; then
    print_status "Backend dependencies installed"
else
    print_error "Failed to install backend dependencies"
    exit 1
fi
cd ..

# Create production environment files
print_info "Creating production environment files..."

# Frontend .env.production
if [ ! -f ".env.production" ]; then
    cat > .env.production << EOF
# KMRCL Document Intelligence - Production Environment

# Backend API URL - UPDATE THIS AFTER BACKEND DEPLOYMENT
VITE_API_BASE_URL=https://your-backend-url.onrender.com

# Application Configuration
VITE_APP_NAME="KMRCL Metro Document Intelligence"
VITE_APP_VERSION="2.0.0"

# Feature Flags
VITE_ENABLE_DEBUG=false
VITE_ENABLE_ANALYTICS=true

# Optional: Google Analytics ID
# VITE_GA_ID=G-XXXXXXXXXX
EOF
    print_status "Created .env.production"
else
    print_warning ".env.production already exists"
fi

# Backend .env for production
if [ ! -f "backend/.env.production" ]; then
    cat > backend/.env.production << EOF
# KMRCL Backend - Production Environment

# Gemini AI API Key (Required) - GET FROM: https://makersuite.google.com/app/apikey
GEMINI_API_KEY=your_gemini_api_key_here

# Server Configuration
NODE_ENV=production
PORT=3000

# Frontend URL (for CORS) - UPDATE THIS AFTER FRONTEND DEPLOYMENT
FRONTEND_URL=https://your-frontend-url.netlify.app

# Optional: Database URLs (if using external storage)
# DATABASE_URL=postgresql://...
# REDIS_URL=redis://...
EOF
    print_status "Created backend/.env.production"
else
    print_warning "backend/.env.production already exists"
fi

# Test build process
print_info "Testing production build..."
npm run build:prod
if [ $? -eq 0 ]; then
    print_status "Production build successful"
    
    # Check build output
    if [ -d "dist" ] && [ "$(ls -A dist)" ]; then
        print_status "Build output directory created with files"
    else
        print_error "Build output directory is empty"
        exit 1
    fi
else
    print_error "Production build failed"
    exit 1
fi

# Test backend syntax
print_info "Testing backend server syntax..."
cd backend
node -c server.js
if [ $? -eq 0 ]; then
    print_status "Backend server syntax is valid"
else
    print_error "Backend server has syntax errors"
    exit 1
fi
cd ..

# Make deployment scripts executable
print_info "Making deployment scripts executable..."
chmod +x scripts/deploy-*.sh
print_status "Deployment scripts are now executable"

# Create deployment checklist
print_info "Creating deployment checklist..."
cat > DEPLOYMENT_CHECKLIST.md << EOF
# 🚀 Deployment Checklist for KMRCL Document Intelligence

## Pre-Deployment Setup ✅
- [x] Dependencies installed
- [x] Production build tested
- [x] Backend syntax validated
- [x] Environment files created

## Required API Keys & Accounts
- [ ] **Gemini AI API Key** - Get from: https://makersuite.google.com/app/apikey
- [ ] **GitHub Repository** - Code pushed to main branch
- [ ] **Deployment Platform Account** (choose one):
  - [ ] Netlify (Frontend) + Render (Backend) - Recommended
  - [ ] Vercel (Frontend) + Railway (Backend)
  - [ ] Other combination

## Backend Deployment Steps
1. [ ] Choose backend platform (Render/Railway/Heroku)
2. [ ] Deploy backend using \`scripts/deploy-render.sh\` or manual setup
3. [ ] Set environment variables:
   - [ ] GEMINI_API_KEY
   - [ ] NODE_ENV=production
   - [ ] FRONTEND_URL (set after frontend deployment)
4. [ ] Test backend health endpoint: \`/health\`
5. [ ] Note backend URL for frontend configuration

## Frontend Deployment Steps
1. [ ] Update \`.env.production\` with actual backend URL
2. [ ] Choose frontend platform (Netlify/Vercel/GitHub Pages)
3. [ ] Deploy frontend using \`scripts/deploy-netlify.sh\` or \`scripts/deploy-vercel.sh\`
4. [ ] Set environment variables in platform dashboard
5. [ ] Test frontend functionality

## Post-Deployment Configuration
1. [ ] Update backend FRONTEND_URL with actual frontend URL
2. [ ] Test complete workflow:
   - [ ] File upload works
   - [ ] Search functionality works
   - [ ] Export features work
3. [ ] Configure custom domain (optional)
4. [ ] Set up monitoring and error tracking

## Production URLs
- **Frontend:** ___________________________
- **Backend:** ____________________________
- **Admin/Monitoring:** ___________________

## Notes
- Keep API keys secure and never commit them to repository
- Test thoroughly before announcing to users
- Set up monitoring for production issues
- Document any custom configurations for team

---
**Deployment Date:** ___________  
**Deployed By:** _______________  
**Version:** 2.0.0
EOF

print_status "Created DEPLOYMENT_CHECKLIST.md"

# Final summary
echo ""
echo "🎉 Production setup complete!"
echo ""
print_info "Next Steps:"
echo "1. 🔑 Get your Gemini AI API key from: https://makersuite.google.com/app/apikey"
echo "2. 📝 Update .env.production and backend/.env.production with your API key"
echo "3. 🚀 Deploy backend first using: ./scripts/deploy-render.sh"
echo "4. 📝 Update .env.production with your backend URL"
echo "5. 🌐 Deploy frontend using: ./scripts/deploy-netlify.sh or ./scripts/deploy-vercel.sh"
echo "6. ✅ Follow the DEPLOYMENT_CHECKLIST.md for complete setup"
echo ""
print_status "All files are ready for production deployment!"
echo ""
print_warning "Remember to:"
echo "- Never commit API keys to your repository"
echo "- Test thoroughly in production environment"
echo "- Set up monitoring and error tracking"
echo "- Keep deployment credentials secure"