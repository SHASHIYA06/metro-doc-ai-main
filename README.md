# 🚀 KMRCL Metro Document Intelligence

**AI-Powered Document Analysis System for KMRCL Metro Engineering**

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](https://github.com/SHASHIYA06/metro-doc-ai-main)
[![Version](https://img.shields.io/badge/version-2.0.0-blue)](https://github.com/SHASHIYA06/metro-doc-ai-main)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

---

## 🌟 **Features**

### **🎨 Advanced 3D User Interface**
- Beautiful animated interface with dynamic particle effects
- Glass morphism design with professional styling
- Interactive 3D elements and smooth transitions
- Responsive design for all devices

### **🧠 AI-Powered Document Analysis**
- Natural language search using Google Gemini AI
- Multi-format support: PDF, DOCX, XLSX, Images with OCR
- Intelligent text extraction and analysis
- Confidence scoring and source citations

### **📁 Google Drive Integration**
- Seamless file management and organization
- Real-time synchronization with Google Drive
- Folder navigation and file browser
- Batch file operations

### **📊 Professional Export System**
- PDF reports with technical analysis
- Word documents with proper formatting
- Excel workbooks with structured data
- Rich content with metadata and sources

### **🔄 Real-time Monitoring**
- Live connection status for all services
- Performance metrics and statistics
- Error handling and user feedback
- System health monitoring

---

## 🚀 **Quick Start**

### **Prerequisites**
- Node.js 18+ 
- Google Account (for Drive integration)
- Gemini API Key (from Google AI Studio)

### **Installation**
```bash
# Clone the repository
git clone https://github.com/SHASHIYA06/metro-doc-ai-main.git
cd metro-doc-ai-main

# Install dependencies
npm install

# Install backend dependencies
cd backend && npm install && cd ..

# Build the application
npm run build
```

### **Environment Setup**
1. Copy `.env.production` and update with your URLs
2. Get Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
3. Deploy Google Apps Script (see deployment guide below)

---

## 🔧 **Configuration**

### **Frontend Environment Variables**
```env
VITE_API_BASE_URL=https://your-backend-url.onrender.com
VITE_APP_SCRIPT_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
VITE_APP_NAME=KMRCL Metro Document Intelligence
VITE_APP_VERSION=2.0.0
```

### **Backend Environment Variables**
```env
NODE_ENV=production
GEMINI_API_KEY=your_actual_gemini_api_key
FRONTEND_URL=https://your-frontend-url.netlify.app
PORT=3000
```

---

## 📋 **Deployment Guide**

### **🔥 CRITICAL: Google Apps Script Deployment**

**⚠️ The Google Apps Script MUST be deployed first for full functionality!**

1. **Go to Google Apps Script Console**
   - Visit: https://script.google.com
   - Create new project: "KMRCL Metro Drive Integration"

2. **Deploy the Script**
   - Copy entire content from `google-apps-script/Code.gs`
   - Enable Google Drive API service
   - Deploy as Web App with "Anyone" access
   - Copy the deployment URL

3. **Test the Deployment**
   ```bash
   node scripts/test-google-drive.js
   ```

### **Backend Deployment (Render)**

1. **Create Render Account**: https://render.com
2. **Connect Repository**: `SHASHIYA06/metro-doc-ai-main`
3. **Configure Service**:
   - Root Directory: `backend`
   - Build Command: `npm install`
   - Start Command: `npm start`
4. **Set Environment Variables** (see above)

### **Frontend Deployment (Netlify)**

1. **Create Netlify Account**: https://netlify.com
2. **Connect Repository**: `SHASHIYA06/metro-doc-ai-main`
3. **Configure Build**:
   - Build Command: `npm run build`
   - Publish Directory: `dist`
4. **Set Environment Variables** (see above)

---

## 🧪 **Testing & Verification**

### **Run All Tests**
```bash
# Test build process
npm run build

# Test Google Apps Script connection
node scripts/test-google-drive.js

# Run deployment verification
node scripts/deployment-verification.js

# Test complete application
node scripts/test-application.js
```

### **Expected Results**
- ✅ Build completes without errors
- ✅ Google Apps Script responds correctly
- ✅ All verification checks pass (31/31)
- ✅ Application loads with green status indicators

---

## 📁 **Project Structure**

```
metro-doc-ai-main/
├── 🎨 Frontend (React + TypeScript + Tailwind)
│   ├── src/components/
│   │   ├── MetroDashboard.tsx          # Main dashboard
│   │   ├── Enhanced3DBackground.tsx    # 3D animations
│   │   └── StatusIndicator.tsx         # Connection monitoring
│   ├── src/services/
│   │   ├── api.ts                      # Backend API
│   │   ├── googleDrive.ts              # Google Drive integration
│   │   └── exportService.ts            # Export functionality
│   └── src/config/
│       └── environment.ts              # Configuration
├── 🔧 Backend (Node.js + Express + AI)
│   └── server.js                       # Complete API server
├── 📜 Google Apps Script
│   └── Code.gs                         # Drive integration script
├── 🚀 Deployment
│   ├── FINAL_DEPLOYMENT_GUIDE.md       # Detailed instructions
│   ├── GOOGLE_APPS_SCRIPT_DEPLOYMENT.md # Apps Script guide
│   └── scripts/                        # Testing and verification
└── 📖 Documentation
    ├── README.md                       # This file
    └── COMPLETE_APPLICATION_SUMMARY.md  # Full feature overview
```

---

## 🔍 **Usage**

### **1. Upload Documents**
- Drag and drop files or click to select
- Supports: PDF, DOC, DOCX, TXT, CSV, XLSX, Images
- Files are processed with AI and stored in Google Drive

### **2. AI-Powered Search**
- Ask natural language questions
- Example: "What are the voltage requirements for traction power?"
- Get intelligent results with confidence scores

### **3. Google Drive Management**
- Browse files and folders
- Create new folders with system/subsystem organization
- Select multiple files for batch analysis

### **4. Export Results**
- Generate professional PDF reports
- Create formatted Word documents
- Export structured Excel workbooks

---

## 🛠️ **Troubleshooting**

### **❌ "Google Drive not connected"**
- Verify Apps Script is deployed with "Anyone" access
- Check Apps Script URL in environment variables
- Run `node scripts/test-google-drive.js` to diagnose

### **❌ "Backend not connected"**
- Check backend URL in environment variables
- Verify backend is running: visit `/health` endpoint
- Ensure Gemini API key is set correctly

### **❌ "Upload fails"**
- Check file size (max 50MB)
- Verify file format is supported
- Check browser console for detailed errors

### **❌ "Build fails"**
- Ensure all dependencies are installed: `npm install`
- Check Node.js version (18+ required)
- Run `npm run build` and check for errors

---

## 📊 **System Requirements**

### **Development**
- Node.js 18+
- npm 9+
- Modern browser (Chrome, Firefox, Safari, Edge)

### **Production**
- Render.com account (backend hosting)
- Netlify.com account (frontend hosting)
- Google Account (Apps Script and Drive)
- Gemini API key (Google AI Studio)

---

## 🤝 **Contributing**

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 **Built By**

**SHASHI SHEKHAR MISHRA**  
KMRCL Engineering Team  

📧 Email: [Contact via GitHub](https://github.com/SHASHIYA06)  
🔗 Repository: https://github.com/SHASHIYA06/metro-doc-ai-main  
🌐 Live Demo: https://kmrcldocumentsearchgoogledrive.netlify.app  

---

## 🎯 **Version Information**

- **Version**: 2.0.0
- **Release Date**: 2024
- **Status**: Production Ready
- **Last Updated**: Latest commit

---

## 🚀 **Deployment Status**

| Component | Status | URL |
|-----------|--------|-----|
| **Frontend** | ✅ Ready | https://kmrcldocumentsearchgoogledrive.netlify.app |
| **Backend** | ✅ Ready | https://metro-doc-ai-main.onrender.com |
| **Apps Script** | ⚠️ Needs Deployment | [Deploy Now](https://script.google.com) |
| **GitHub** | ✅ Synchronized | https://github.com/SHASHIYA06/metro-doc-ai-main |

---

**🎉 Ready for Production Deployment!**

For detailed deployment instructions, see:
- 📖 [Complete Deployment Guide](FINAL_DEPLOYMENT_GUIDE.md)
- 📜 [Google Apps Script Setup](GOOGLE_APPS_SCRIPT_DEPLOYMENT.md)
- 📋 [Application Summary](COMPLETE_APPLICATION_SUMMARY.md)