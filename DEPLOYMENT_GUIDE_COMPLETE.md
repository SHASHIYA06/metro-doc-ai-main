# 🚀 Complete Deployment Guide - KMRCL Metro Document Intelligence

## 📋 Your Current Setup
- **Frontend URL**: https://kmrcldocumentsearchgoogledrive.netlify.app
- **Backend URL**: https://metro-doc-ai-main.onrender.com
- **Google Apps Script URL**: https://script.google.com/macros/s/AKfycbzq7-DRXeX5dbcCAXfSqDgjubDAWkTiHOMdZ1PLaCdknrPkKfbo5znLvntYN7lICzz_mQ/exec

## 🔧 What's Been Fixed & Upgraded

### ✅ Google Drive Integration
- **Complete Google Apps Script**: Full Drive API integration for file management
- **File Upload to Drive**: Files are uploaded to Google Drive AND processed by AI
- **Folder Navigation**: Browse your Google Drive folders and files
- **File Selection**: Select multiple files for AI analysis
- **Search Integration**: Search files in Drive with metadata filtering

### ✅ Enhanced AI Processing
- **Multi-format Support**: PDF, DOCX, XLSX, Images, CSV with OCR
- **Advanced RAG**: Better document chunking and vector search
- **Metadata Extraction**: Automatic extraction of technical specifications
- **System Classification**: Organize by System/Subsystem

### ✅ Modern UI with Glass Morphism
- **5 Main Tabs**: Google Drive, Upload, AI Search, Analysis, Results
- **Real-time Status**: Connection indicators for both backend and Drive
- **Progress Tracking**: Visual upload and processing progress
- **Responsive Design**: Works on all devices

## 🚀 Step-by-Step Deployment

### Step 1: Deploy Google Apps Script

1. **Open Google Apps Script**
   - Go to [script.google.com](https://script.google.com)
   - Click "New Project"

2. **Replace Code**
   - Delete the default `myFunction()`
   - Copy and paste the entire content from `google-apps-script/Code.gs`

3. **Enable Drive API**
   - Click "Services" (+ icon) in the left sidebar
   - Find "Google Drive API" and add it
   - Set identifier as "Drive"

4. **Configure and Deploy**
   ```
   Project Name: KMRCL Metro Drive Integration
   ```
   - Click "Deploy" → "New Deployment"
   - Type: Web app
   - Execute as: Me
   - Who has access: Anyone
   - Click "Deploy"
   - Copy the Web App URL (this should match your existing URL)

### Step 2: Update Backend on Render

1. **Go to Render Dashboard**
   - Open your `metro-doc-ai-main` service

2. **Update Environment Variables**
   ```
   NODE_ENV=production
   GEMINI_API_KEY=your_gemini_api_key_here
   FRONTEND_URL=https://kmrcldocumentsearchgoogledrive.netlify.app
   PORT=3000
   ```

3. **Redeploy**
   - The service will automatically redeploy with the updated CORS settings

### Step 3: Update Frontend on Netlify

1. **Go to Netlify Dashboard**
   - Open your `kmrcldocumentsearchgoogledrive` site

2. **Update Environment Variables**
   ```
   VITE_API_BASE_URL=https://metro-doc-ai-main.onrender.com
   VITE_APP_SCRIPT_URL=https://script.google.com/macros/s/AKfycbzq7-DRXeX5dbcCAXfSqDgjubDAWkTiHOMdZ1PLaCdknrPkKfbo5znLvntYN7lICzz_mQ/exec
   VITE_APP_NAME=KMRCL Metro Document Intelligence
   VITE_APP_VERSION=2.0.0
   ```

3. **Trigger Redeploy**
   - Go to "Deploys" tab
   - Click "Trigger deploy" → "Deploy site"

## 🧪 Testing Your Deployment

### 1. Test Connections
- Visit: https://kmrcldocumentsearchgoogledrive.netlify.app
- Check status indicators:
  - ✅ Backend: Connected (green)
  - ✅ Drive: Connected (green)

### 2. Test Google Drive Integration
- Click "Google Drive" tab
- You should see your Drive files and folders
- Try navigating folders
- Select some files and click "Analyze Selected"

### 3. Test File Upload
- Click "Upload" tab
- Drag and drop a PDF or image file
- File should upload to Google Drive AND be processed by AI

### 4. Test AI Search
- Click "AI Search" tab
- Enter a query like "door control specifications"
- Should return relevant results from your indexed documents

## 🔍 Features Overview

### 📁 Google Drive Tab
- **Browse Files**: Navigate your Google Drive folders
- **File Selection**: Select multiple files with checkboxes
- **Folder Navigation**: Breadcrumb navigation with back button
- **File Analysis**: Analyze selected files with AI

### ⬆️ Upload Tab
- **Drag & Drop**: Upload files to both Google Drive and AI processing
- **System Classification**: Tag files with System/Subsystem
- **Folder Creation**: Create new folders in Drive
- **Progress Tracking**: Real-time upload and processing status

### 🧠 AI Search Tab
- **Natural Language**: Ask questions about your documents
- **System Filtering**: Filter by System/Subsystem
- **Quick Queries**: Pre-built queries for common searches
- **Advanced RAG**: Semantic search with context

### 📊 Analysis Tab
- **Document Analysis**: Detailed technical analysis
- **Component Extraction**: Automatic part number and specification extraction
- **Architecture Mapping**: System architecture visualization

### 👁️ Results Tab
- **Search Results**: Detailed results with source citations
- **Confidence Scores**: Match percentages for each result
- **Source Preview**: Preview of source documents
- **Export Options**: Export results as PDF

## 🔧 Advanced Configuration

### Google Drive Folder Structure
The system uses this folder ID as root: `1mjA3OiBaDX1-ins9Myr8QtU8esyyKkTG`

You can organize files like:
```
📁 Metro Documents (Root)
├── 📁 Rolling Stock
│   ├── 📁 Doors
│   ├── 📁 HVAC
│   └── 📁 Traction
├── 📁 Infrastructure
│   ├── 📁 Signaling
│   └── 📁 Power Supply
└── 📁 Safety Systems
```

### File Processing Pipeline
1. **Upload**: File uploaded to Google Drive
2. **Extraction**: Text extracted (PDF, OCR for images, etc.)
3. **Chunking**: Document split into semantic chunks
4. **Embedding**: Vector embeddings created with Gemini
5. **Indexing**: Stored in backend vector database
6. **Search**: Available for AI-powered search

## 🆘 Troubleshooting

### "Drive: Disconnected" Status
1. Check Google Apps Script deployment
2. Verify the Apps Script URL in environment variables
3. Ensure Drive API is enabled in Apps Script

### "Backend: Disconnected" Status
1. Check Render service is running
2. Verify backend URL in Netlify environment variables
3. Check CORS settings in backend

### Files Not Appearing
1. Verify Google Drive folder permissions
2. Check the MAIN_FOLDER_ID in Apps Script
3. Ensure files are not in trash

### Upload Failures
1. Check file size limits (50MB max)
2. Verify supported file types
3. Check Google Drive storage quota

### Search Returns No Results
1. Ensure files have been processed (check backend stats)
2. Try simpler search queries
3. Check Gemini API key and quotas

## 📊 Performance Expectations

- **File Upload**: 30-60 seconds per file (depending on size)
- **AI Search**: 3-10 seconds response time
- **Drive Navigation**: Instant (cached)
- **Concurrent Users**: Up to 100 (Render free tier)

## 🔐 Security Features

- **CORS Protection**: Only your domains can access the APIs
- **File Size Limits**: 50MB maximum per file
- **API Rate Limiting**: Built-in protection against abuse
- **Secure Headers**: Security headers configured in Netlify

## 📈 Monitoring

### Health Endpoints
- **Backend Health**: https://metro-doc-ai-main.onrender.com/health
- **Backend Stats**: https://metro-doc-ai-main.onrender.com/stats
- **Apps Script Test**: Run `testScript()` function in Apps Script editor

### Logs
- **Render Logs**: Available in Render dashboard
- **Netlify Logs**: Available in Netlify dashboard
- **Apps Script Logs**: Available in Apps Script editor

## 🎯 Success Criteria

After deployment, you should be able to:
- ✅ Browse Google Drive files in the application
- ✅ Upload files to both Drive and AI processing
- ✅ Search documents with natural language
- ✅ Get detailed AI analysis of technical documents
- ✅ Navigate folders and organize documents
- ✅ Export results and analysis

## 🚀 Next Steps

1. **Deploy the Google Apps Script** (most important)
2. **Update environment variables** on both Netlify and Render
3. **Test all functionality** with the checklist above
4. **Upload some sample documents** to test the full pipeline
5. **Share the application** with your team

---

**Your application is now ready for production use with full Google Drive integration and advanced AI capabilities!**

**Live URL**: https://kmrcldocumentsearchgoogledrive.netlify.app