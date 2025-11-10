# 🚀 Production Deployment Guide
## KMRCL Metro Document Intelligence - Enhanced AI Search Application

### 📋 Overview
This guide provides complete deployment instructions for both frontend and backend components of the enhanced Google Drive AI Search application across multiple popular platforms.

## 🏗️ Architecture Overview

**Frontend (React + Vite + TypeScript)**
- Modern React application with Vite build system
- Enhanced UI with glassmorphism design
- Real-time search and file processing
- Export functionality (PDF, Excel, Word)

**Backend (Node.js + Express)**
- Enhanced RAG server with AI-powered search
- Multi-format file processing (PDF, DOCX, Images, CAD files)
- Vector embeddings with Gemini AI
- Advanced chunking and metadata extraction

---

## 🔧 Prerequisites

### Required Accounts & Services
1. **Google Cloud Console** - For Gemini AI API key
2. **GitHub Account** - For code repository
3. **Platform Account** (choose one or more):
   - Netlify (Frontend)
   - Vercel (Frontend)
   - Render (Backend)
   - Railway (Backend)
   - Heroku (Backend)

### Required API Keys
1. **Gemini AI API Key** (Required for AI features)
   - Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Create new API key
   - Copy the key (starts with `AIza...`)

---

## 📁 Environment Variables

### Frontend (.env)
```bash
# Backend API URL - Update based on your backend deployment
VITE_API_BASE_URL=https://your-backend-url.onrender.com

# Application Configuration
VITE_APP_NAME="KMRCL Metro Document Intelligence"
VITE_APP_VERSION="2.0.0"

# Feature Flags
VITE_ENABLE_DEBUG=false
VITE_ENABLE_ANALYTICS=true

# Optional: Google Analytics
VITE_GA_ID=G-XXXXXXXXXX
```

### Backend (.env)
```bash
# Gemini AI API Key (Required)
GEMINI_API_KEY=AIzaSyDhOJhJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJ

# Server Configuration
NODE_ENV=production
PORT=3000

# Frontend URL (for CORS)
FRONTEND_URL=https://your-frontend-url.netlify.app

# Optional: Database URLs (if using external storage)
# DATABASE_URL=postgresql://...
# REDIS_URL=redis://...
```

---

## 🌐 Frontend Deployment

### Option 1: Netlify (Recommended)

#### Step 1: Prepare Repository
```bash
# Ensure your code is pushed to GitHub
git add .
git commit -m "Prepare for production deployment"
git push origin main
```

#### Step 2: Deploy to Netlify
1. **Login to Netlify** → [netlify.com](https://netlify.com)
2. **New site from Git** → Connect to GitHub
3. **Select Repository** → Choose your project
4. **Build Settings:**
   - Build command: `npm run build:prod`
   - Publish directory: `dist`
   - Node version: `18`

#### Step 3: Environment Variables
In Netlify Dashboard → Site Settings → Environment Variables:
```
VITE_API_BASE_URL = https://your-backend-url.onrender.com
VITE_APP_NAME = KMRCL Metro Document Intelligence
VITE_APP_VERSION = 2.0.0
VITE_ENABLE_DEBUG = false
```

#### Step 4: Deploy Settings
The `netlify.toml` file is already configured:
```toml
[build]
  publish = "dist"
  command = "npm run build:prod"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### Option 2: Vercel

#### Step 1: Deploy to Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Follow prompts:
# - Link to existing project? No
# - Project name: kmrcl-document-search
# - Directory: ./
# - Override settings? Yes
# - Build command: npm run build:prod
# - Output directory: dist
```

#### Step 2: Environment Variables
```bash
# Add environment variables
vercel env add VITE_API_BASE_URL
# Enter: https://your-backend-url.onrender.com

vercel env add VITE_APP_NAME
# Enter: KMRCL Metro Document Intelligence

# Deploy with environment variables
vercel --prod
```

### Option 3: GitHub Pages

#### Step 1: Build Configuration
Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Build
      run: npm run build:prod
      env:
        VITE_API_BASE_URL: ${{ secrets.VITE_API_BASE_URL }}
        VITE_APP_NAME: "KMRCL Metro Document Intelligence"
    
    - name: Deploy
      uses: peaceiris/actions-gh-pages@v3
      with:
        github_token: ${{ secrets.GITHUB_TOKEN }}
        publish_dir: ./dist
```

---

## 🖥️ Backend Deployment

### Option 1: Render (Recommended)

#### Step 1: Prepare Backend
Ensure `backend/package.json` has correct start script:
```json
{
  "scripts": {
    "start": "node server.js"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
```

#### Step 2: Deploy to Render
1. **Login to Render** → [render.com](https://render.com)
2. **New Web Service** → Connect GitHub repository
3. **Configuration:**
   - Name: `kmrcl-backend`
   - Environment: `Node`
   - Region: Choose closest to users
   - Branch: `main`
   - Root Directory: `backend`
   - Build Command: `npm install`
   - Start Command: `npm start`

#### Step 3: Environment Variables
In Render Dashboard → Environment:
```
GEMINI_API_KEY = AIzaSyDhOJhJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJ
NODE_ENV = production
FRONTEND_URL = https://your-frontend-url.netlify.app
```

#### Step 4: Advanced Settings
- **Auto-Deploy:** Yes
- **Health Check Path:** `/health`
- **Instance Type:** Starter (can upgrade later)

### Option 2: Railway

#### Step 1: Deploy to Railway
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway init
railway up

# Set environment variables
railway variables set GEMINI_API_KEY=AIzaSyDhOJhJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJ
railway variables set NODE_ENV=production
railway variables set FRONTEND_URL=https://your-frontend-url.netlify.app
```

#### Step 2: Configure Railway
Create `railway.json` in backend directory:
```json
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm start",
    "healthcheckPath": "/health"
  }
}
```

### Option 3: Heroku

#### Step 1: Prepare for Heroku
Create `Procfile` in backend directory:
```
web: node server.js
```

#### Step 2: Deploy to Heroku
```bash
# Install Heroku CLI and login
heroku login

# Create app
heroku create kmrcl-backend

# Set environment variables
heroku config:set GEMINI_API_KEY=AIzaSyDhOJhJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJ
heroku config:set NODE_ENV=production
heroku config:set FRONTEND_URL=https://your-frontend-url.netlify.app

# Deploy
git subtree push --prefix backend heroku main
```

---

## 🔗 Connecting Frontend & Backend

### Step 1: Update Frontend Environment
After backend deployment, update frontend environment variables:

**Netlify:**
```bash
# Update VITE_API_BASE_URL in Netlify dashboard
VITE_API_BASE_URL = https://kmrcl-backend.onrender.com
```

**Vercel:**
```bash
vercel env add VITE_API_BASE_URL production
# Enter: https://kmrcl-backend.onrender.com
vercel --prod
```

### Step 2: Update Backend CORS
Ensure backend allows your frontend domain in `server.js`:
```javascript
const allowedOrigins = [
  'http://localhost:5173',
  'https://your-frontend-url.netlify.app',
  'https://your-frontend-url.vercel.app',
  process.env.FRONTEND_URL
].filter(Boolean);
```

---

## 🧪 Testing Deployment

### Step 1: Health Checks
```bash
# Test backend health
curl https://your-backend-url.onrender.com/health

# Expected response:
{
  "ok": true,
  "indexed": 0,
  "uptime": 123.45,
  "memory": {...},
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Step 2: Frontend Functionality
1. **Visit your frontend URL**
2. **Test file upload** (use a small PDF/text file)
3. **Test search functionality**
4. **Test export features**
5. **Check browser console** for errors

### Step 3: End-to-End Test
```bash
# Test complete workflow
curl -X POST https://your-backend-url.onrender.com/ingest-json \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Test document content for KMRCL metro system",
    "fileName": "test.txt",
    "system": "Test System",
    "subsystem": "Test Subsystem"
  }'

# Test search
curl -X POST https://your-backend-url.onrender.com/ask \
  -H "Content-Type: application/json" \
  -d '{
    "query": "metro system"
  }'
```

---

## 🔒 Security & Performance

### Security Checklist
- [ ] **API Keys:** Never commit API keys to repository
- [ ] **CORS:** Properly configured for production domains
- [ ] **HTTPS:** Both frontend and backend use HTTPS
- [ ] **Environment Variables:** All sensitive data in env vars
- [ ] **File Upload Limits:** Backend has proper file size limits (100MB)

### Performance Optimization
- [ ] **CDN:** Frontend assets served via CDN (automatic with Netlify/Vercel)
- [ ] **Compression:** Backend uses gzip compression
- [ ] **Caching:** Proper cache headers for static assets
- [ ] **Database:** Consider external database for large-scale usage
- [ ] **Monitoring:** Set up error tracking and performance monitoring

---

## 📊 Monitoring & Maintenance

### Application Monitoring
1. **Render/Railway Dashboard:** Monitor backend performance
2. **Netlify/Vercel Analytics:** Track frontend usage
3. **Error Tracking:** Consider Sentry for error monitoring
4. **Uptime Monitoring:** Use UptimeRobot or similar

### Regular Maintenance
- **Dependencies:** Update packages monthly
- **Security:** Monitor for security vulnerabilities
- **Performance:** Review and optimize based on usage
- **Backups:** Regular backups of any persistent data

---

## 🚨 Troubleshooting

### Common Issues

#### Frontend Build Errors
```bash
# Clear cache and rebuild
rm -rf node_modules dist
npm install
npm run build:prod
```

#### Backend Deployment Issues
```bash
# Check logs
# Render: View logs in dashboard
# Railway: railway logs
# Heroku: heroku logs --tail
```

#### CORS Errors
- Ensure backend `allowedOrigins` includes your frontend URL
- Check environment variables are set correctly
- Verify HTTPS is used for production

#### API Key Issues
- Verify Gemini API key is valid and has quota
- Check environment variable is set correctly
- Test API key with direct Gemini API call

### Support Resources
- **Documentation:** Check component documentation in `/src/components/`
- **Logs:** Always check both frontend (browser console) and backend logs
- **Community:** GitHub Issues for bug reports and feature requests

---

## 🎯 Production Checklist

### Pre-Deployment
- [ ] Code tested locally
- [ ] Environment variables configured
- [ ] API keys obtained and tested
- [ ] Build process verified
- [ ] Security review completed

### Post-Deployment
- [ ] Health checks passing
- [ ] Frontend loads correctly
- [ ] File upload works
- [ ] Search functionality works
- [ ] Export features work
- [ ] Error tracking configured
- [ ] Performance monitoring set up

### Go-Live
- [ ] DNS configured (if using custom domain)
- [ ] SSL certificates active
- [ ] Monitoring alerts configured
- [ ] Team notified of new URLs
- [ ] Documentation updated

---

## 📞 Support & Contact

**Developer:** SHASHI SHEKHAR MISHRA  
**Project:** KMRCL Metro Document Intelligence  
**Version:** 2.0.0  

For technical support or deployment assistance, refer to the application documentation or create an issue in the project repository.

---

*This deployment guide ensures your enhanced Google Drive AI Search application is production-ready with proper security, performance, and monitoring configurations.*