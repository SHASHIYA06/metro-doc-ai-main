# ⚡ Quick Deployment Summary
## KMRCL Metro Document Intelligence - Production Ready

### 🎯 One-Command Setup
```bash
# Run this first to prepare everything
./scripts/setup-production.sh
```

### 🚀 Recommended Deployment Stack

**Frontend: Netlify** + **Backend: Render** (Free tier available)

#### Step 1: Get API Key
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create API key (starts with `AIza...`)
3. Copy and save securely

#### Step 2: Deploy Backend (5 minutes)
```bash
# Prepare backend for Render
./scripts/deploy-render.sh

# Then go to render.com:
# 1. New Web Service → Connect GitHub
# 2. Root Directory: backend
# 3. Build: npm install
# 4. Start: npm start
# 5. Add environment variables:
#    - GEMINI_API_KEY=your_api_key
#    - NODE_ENV=production
```

#### Step 3: Deploy Frontend (3 minutes)
```bash
# Update .env.production with backend URL
# Then deploy to Netlify
./scripts/deploy-netlify.sh

# Or go to netlify.com:
# 1. New site from Git → Connect GitHub
# 2. Build: npm run build:prod
# 3. Publish: dist
# 4. Add environment variables:
#    - VITE_API_BASE_URL=your_backend_url
```

#### Step 4: Connect & Test (2 minutes)
1. Update backend `FRONTEND_URL` with your Netlify URL
2. Test file upload and search
3. ✅ You're live!

### 📋 Alternative Platforms

| Platform | Type | Free Tier | Deploy Script |
|----------|------|-----------|---------------|
| Netlify | Frontend | ✅ Yes | `./scripts/deploy-netlify.sh` |
| Vercel | Frontend | ✅ Yes | `./scripts/deploy-vercel.sh` |
| Render | Backend | ✅ Yes | `./scripts/deploy-render.sh` |
| Railway | Backend | ✅ Limited | Manual setup |
| Heroku | Backend | ❌ Paid only | Manual setup |

### 🔧 Environment Variables Quick Reference

**Frontend (.env.production):**
```bash
VITE_API_BASE_URL=https://your-backend.onrender.com
VITE_APP_NAME="KMRCL Metro Document Intelligence"
VITE_ENABLE_DEBUG=false
```

**Backend (.env):**
```bash
GEMINI_API_KEY=AIzaSyDhOJhJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJ
NODE_ENV=production
FRONTEND_URL=https://your-frontend.netlify.app
```

### 🧪 Test Your Deployment
```bash
# Test backend health
curl https://your-backend.onrender.com/health

# Should return: {"ok": true, "indexed": 0, ...}
```

### 📞 Need Help?
- 📖 Full guide: `PRODUCTION_DEPLOYMENT_GUIDE.md`
- ✅ Checklist: `DEPLOYMENT_CHECKLIST.md`
- 🔧 Setup script: `./scripts/setup-production.sh`

---
**Total deployment time: ~10 minutes** | **Cost: Free tier available** | **Scalable: Yes**