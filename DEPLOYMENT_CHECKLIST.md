# 🚀 KMRCL Metro Intelligence - Deployment Checklist

## Pre-Deployment Checklist

### ✅ Code Preparation
- [ ] All code committed to GitHub
- [ ] Environment variables configured
- [ ] Build process tested locally (`npm run build`)
- [ ] No console errors in production build
- [ ] API endpoints tested

### ✅ Backend Deployment (Render)
- [ ] Render account created
- [ ] Repository connected to Render
- [ ] Environment variables set:
  - [ ] `NODE_ENV=production`
  - [ ] `GEMINI_API_KEY=your_key`
  - [ ] `FRONTEND_URL=https://your-netlify-url`
  - [ ] `PORT=3000`
- [ ] Backend deployed successfully
- [ ] Health endpoint accessible: `/health`
- [ ] Backend URL noted for frontend config

### ✅ Frontend Deployment (Netlify)
- [ ] Netlify account created
- [ ] Repository connected to Netlify
- [ ] Build settings configured:
  - [ ] Build command: `npm run build`
  - [ ] Publish directory: `dist`
- [ ] Environment variables set:
  - [ ] `VITE_API_BASE_URL=https://your-render-backend`
  - [ ] `VITE_APP_NAME=KMRCL Metro Document Intelligence`
  - [ ] `VITE_APP_VERSION=2.0.0`
- [ ] Frontend deployed successfully
- [ ] Site accessible and loads correctly

### ✅ Integration Testing
- [ ] Frontend connects to backend (green status indicator)
- [ ] File upload works
- [ ] Document processing completes
- [ ] Search functionality works
- [ ] Results display correctly
- [ ] No CORS errors in browser console

## Deployment URLs

### Backend (Render)
- **Service Name**: `kmrcl-backend`
- **URL**: `https://kmrcl-backend.onrender.com`
- **Health Check**: `https://kmrcl-backend.onrender.com/health`

### Frontend (Netlify)
- **Site Name**: `kmrcl-metro-intelligence`
- **URL**: `https://kmrcl-metro-intelligence.netlify.app`

## Environment Variables Reference

### Backend (Render)
```env
NODE_ENV=production
GEMINI_API_KEY=your_gemini_api_key_here
FRONTEND_URL=https://kmrcl-metro-intelligence.netlify.app
PORT=3000
CHUNK_SIZE=1500
CHUNK_OVERLAP=300
MAX_SNIPPETS=15
SIMILARITY_THRESHOLD=0.7
```

### Frontend (Netlify)
```env
VITE_API_BASE_URL=https://kmrcl-backend.onrender.com
VITE_APP_NAME=KMRCL Metro Document Intelligence
VITE_APP_VERSION=2.0.0
VITE_ENABLE_DEBUG=false
VITE_ENABLE_ANALYTICS=true
```

## Post-Deployment Testing

### 🧪 Functional Tests
1. **Connection Test**
   - [ ] Visit frontend URL
   - [ ] Check status indicator shows "Connected"
   - [ ] No console errors

2. **Upload Test**
   - [ ] Upload a PDF document
   - [ ] Check processing completes
   - [ ] Verify document count increases

3. **Search Test**
   - [ ] Perform AI search query
   - [ ] Check results are returned
   - [ ] Verify source citations work

4. **Performance Test**
   - [ ] Page loads in < 3 seconds
   - [ ] Search responds in < 10 seconds
   - [ ] File upload processes reasonably fast

### 🔧 Technical Verification
- [ ] HTTPS enabled on both services
- [ ] CORS configured correctly
- [ ] Error handling works
- [ ] Logs are accessible in dashboards

## Troubleshooting Common Issues

### ❌ "Backend not connected"
1. Check backend URL in frontend environment variables
2. Verify backend is running: visit `/health` endpoint
3. Check CORS configuration in backend
4. Verify Gemini API key is set correctly

### ❌ "Upload fails"
1. Check file size limits
2. Verify backend has sufficient memory
3. Check backend logs for errors
4. Test with smaller files first

### ❌ "Search returns no results"
1. Verify documents were uploaded successfully
2. Check backend stats: `/stats` endpoint
3. Try simpler search queries
4. Check Gemini API key and quotas

## Monitoring and Maintenance

### 📊 Regular Checks
- [ ] Backend uptime (Render dashboard)
- [ ] Frontend availability (Netlify dashboard)
- [ ] API usage and quotas (Google Cloud Console)
- [ ] Error rates and performance metrics

### 🔄 Updates
- [ ] Monitor for security updates
- [ ] Update dependencies regularly
- [ ] Test updates in staging environment first
- [ ] Keep documentation updated

## Support Contacts

- **Technical Issues**: Create GitHub issue
- **Deployment Help**: Check Render/Netlify documentation
- **API Issues**: Check Google Gemini API status

---

**Deployment Date**: ___________
**Deployed By**: SHASHI SHEKHAR MISHRA
**Version**: 2.0.0