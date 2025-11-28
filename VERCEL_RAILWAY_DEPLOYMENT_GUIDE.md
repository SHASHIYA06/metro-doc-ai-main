# 🚀 KMRCL Metro Intelligence - Vercel + Railway Deployment Guide

## ✅ **DEPLOYMENT ISSUE FIXED!**

The Vercel deployment error has been resolved. Your application is now properly configured for:
- **Frontend**: Vercel (with correct `dist` output directory)
- **Backend**: Railway (with proper CORS and environment setup)

## 🌐 **Deployment URLs**

### **Production Configuration**
- **Frontend (Vercel)**: https://metro-doc-ai-main.vercel.app
- **Backend (Railway)**: https://metro-doc-ai-main-production.up.railway.app
- **Google Apps Script**: https://script.google.com/macros/s/AKfycbzq7-DRXeX5dbcCAXfSqDgjubDAWkTiHOMdZ1PLaCdknrPkKfbo5znLvntYN7lICzz_mQ/exec
- **Google Drive Folder**: 1fUHu5fb5Z77Aq4cAiK4Zybq-Dpgjf0xlzEDsxIgT9m8

## 🔧 **Files Created/Updated**

### **✅ Vercel Configuration**
- `vercel.json` - Proper Vercel configuration with `dist` output directory
- `.env.example` - Environment variables template for frontend

### **✅ Railway Configuration**  
- `railway.json` - Railway deployment configuration
- `backend/.env.example` - Environment variables template for backend
- Updated CORS origins in `backend/server.js`

### **✅ Deployment Scripts**
- `scripts/deploy-vercel.sh` - Automated Vercel deployment
- `scripts/deploy-railway.sh` - Automated Railway deployment

## 🚀 **Step-by-Step Deployment**

### **Step 1: Deploy Backend to Railway**

1. **Install Railway CLI**
   ```bash
   npm install -g @railway/cli
   ```

2. **Deploy Backend**
   ```bash
   cd backend
   railway login
   railway up
   ```

3. **Set Environment Variables in Railway Dashboard**
   - Go to your Railway project dashboard
   - Navigate to Variables tab
   - Add these variables:
   ```
   NODE_ENV=production
   GEMINI_API_KEY=your_actual_gemini_api_key_here
   FRONTEND_URL=https://metro-doc-ai-main.vercel.app
   PORT=3000
   ```

4. **Test Backend**
   - Visit: https://metro-doc-ai-main-production.up.railway.app/health
   - Should return: `{"status":"healthy","timestamp":"..."}`

### **Step 2: Deploy Frontend to Vercel**

1. **Install Vercel CLI** (if not already installed)
   ```bash
   npm install -g vercel
   ```

2. **Build and Deploy**
   ```bash
   npm run build
   vercel --prod
   ```

3. **Set Environment Variables in Vercel Dashboard**
   - Go to your Vercel project dashboard
   - Navigate to Settings → Environment Variables
   - Add these variables:
   ```
   VITE_API_BASE_URL=https://metro-doc-ai-main-production.up.railway.app
   VITE_APP_SCRIPT_URL=https://script.google.com/macros/s/AKfycbzq7-DRXeX5dbcCAXfSqDgjubDAWkTiHOMdZ1PLaCdknrPkKfbo5znLvntYN7lICzz_mQ/exec
   VITE_APP_NAME=KMRCL Metro Document Intelligence
   VITE_APP_VERSION=2.0.0
   ```

4. **Redeploy Frontend**
   - After setting environment variables, trigger a new deployment
   - Or run: `vercel --prod` again

### **Step 3: Deploy Google Apps Script**

1. **Open Google Apps Script**
   - Go to [script.google.com](https://script.google.com)
   - Create a new project

2. **Add the Code**
   - Copy the entire content from `google-apps-script/Code.gs`
   - Paste it into the script editor

3. **Enable Google Drive API**
   - Click "Services" (+ icon) in the left sidebar
   - Find "Google Drive API" and add it
   - Set identifier as "Drive"

4. **Deploy as Web App**
   - Click "Deploy" → "New Deployment"
   - Type: Web app
   - Execute as: Me
   - Who has access: Anyone
   - Click "Deploy"
   - Copy the deployment URL (should match the one in environment variables)

## 🧪 **Testing Your Deployment**

### **1. Backend Health Check**
```bash
curl https://metro-doc-ai-main-production.up.railway.app/health
```
Expected response: `{"status":"healthy"}`

### **2. Frontend Connection Test**
- Visit: https://metro-doc-ai-main.vercel.app
- Check status indicators:
  - ✅ Backend: Connected (green)
  - ✅ Drive: Connected (green)

### **3. Google Drive Integration Test**
- Click "Google Drive" tab
- Should load your Drive files and folders
- Try navigating folders and selecting files

### **4. File Upload Test**
- Click "Upload" tab
- Drag and drop a PDF or image file
- Should upload to Google Drive and process with AI

### **5. AI Search Test**
- Click "AI Search" tab
- Enter a query like "door control specifications"
- Should return relevant results

## 🔧 **Configuration Files Explained**

### **vercel.json**
```json
{
  "version": 2,
  "buildCommand": "npm run build",
  "outputDirectory": "dist",  // ← This fixes the Vercel error!
  "installCommand": "npm install",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### **railway.json**
```json
{
  "build": {
    "builder": "nixpacks"
  },
  "deploy": {
    "startCommand": "node server.js",
    "healthcheckPath": "/health",
    "restartPolicyType": "ON_FAILURE"
  }
}
```

## 🆘 **Troubleshooting**

### **Vercel Build Errors**
- ✅ **FIXED**: "No Output Directory named 'build' found" 
- Solution: Added `"outputDirectory": "dist"` in `vercel.json`

### **Railway Backend Issues**
- Check environment variables are set correctly
- Verify CORS origins include your Vercel domain
- Test health endpoint: `/health`

### **Google Drive Connection Issues**
- Verify Apps Script is deployed as web app
- Check the Apps Script URL in environment variables
- Ensure Google Drive API is enabled

### **CORS Errors**
- Backend now includes Vercel domain in allowed origins
- Check that frontend URL matches exactly in Railway environment variables

## 🎯 **Production Checklist**

- [ ] Backend deployed to Railway with health check passing
- [ ] Frontend deployed to Vercel with correct build output
- [ ] Google Apps Script deployed and accessible
- [ ] All environment variables set correctly
- [ ] CORS configured for production domains
- [ ] Google Drive integration working
- [ ] File upload and AI processing functional
- [ ] Export functionality (PDF, Word, Excel) working
- [ ] 3D UI effects displaying properly
- [ ] Mobile responsiveness verified

## 🎉 **Success Criteria**

After successful deployment, you should have:

1. **✅ Working Frontend**: Beautiful 3D UI with glass morphism effects
2. **✅ Working Backend**: AI-powered document processing and search
3. **✅ Google Drive Integration**: File browsing, upload, and management
4. **✅ Multi-format Export**: PDF, Word, and Excel generation
5. **✅ Real-time Status**: Live connection monitoring
6. **✅ Mobile Support**: Responsive design for all devices

## 🚀 **Quick Deploy Commands**

```bash
# Deploy everything at once
./scripts/deploy-railway.sh    # Deploy backend first
./scripts/deploy-vercel.sh     # Then deploy frontend

# Or manually:
cd backend && railway up       # Deploy backend
npm run build && vercel --prod # Deploy frontend
```

## 🔗 **Important Links**

- **Vercel Dashboard**: https://vercel.com/dashboard
- **Railway Dashboard**: https://railway.app/dashboard
- **Google Apps Script**: https://script.google.com
- **GitHub Repository**: https://github.com/SHASHIYA06/metro-doc-ai-main

---

**🎉 Your KMRCL Metro Document Intelligence application is now ready for production deployment with Vercel + Railway!**

**Built with ❤️ for SHASHI SHEKHAR MISHRA and the KMRCL Metro Engineering Team**