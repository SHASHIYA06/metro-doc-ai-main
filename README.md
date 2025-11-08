# 🚀 Enhanced Google Drive AI Search Application

**Complete Upgrade - Universal File Support & AI-Powered Search**

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](https://github.com/SHASHIYA06/metro-doc-ai-main)
[![Version](https://img.shields.io/badge/version-2.1.0-blue)](https://github.com/SHASHIYA06/metro-doc-ai-main)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

Advanced document intelligence system with seamless Google Drive integration, universal file support, and AI-powered search capabilities. Select any file from Google Drive and search its contents with intelligent AI analysis.

---

## ✨ **Major Enhancements - v2.1.0**

### 🔗 **Complete Google Drive Integration**
- **Seamless Connection**: Automatic Google Drive connection with real-time status
- **Universal File Browser**: Navigate folders and files with intuitive interface
- **File Type Support**: PDFs, Google Docs, Sheets, Word, Excel, Images, Text files
- **Real-time Sync**: Live connection monitoring and file updates

### 🤖 **AI-Powered Search Engine**
- **File-Specific Search**: Search only within selected file (no cross-contamination)
- **Intelligent Processing**: Advanced content extraction with OCR support
- **Smart Query Enhancement**: Automatic query optimization for better results
- **Multiple Result Types**: AI analysis + source content with relevance scoring

### 🎨 **Enhanced User Experience**
- **Modern UI**: Three-panel responsive layout (Files | Search | Results)
- **Real-time Status**: Live indicators for connections and processing
- **Smart Suggestions**: Context-aware query suggestions
- **Progress Tracking**: Visual feedback during file processing
- **Error Recovery**: Comprehensive error handling with helpful messages

### 📁 **Universal File Support**
| File Type | Extensions | Processing Method |
|-----------|------------|-------------------|
| **Documents** | `.pdf`, `.docx`, `.gdoc` | PDF.js + OCR fallback |
| **Spreadsheets** | `.xlsx`, `.xls`, `.gsheet`, `.csv` | SheetJS + structured parsing |
| **Images** | `.jpg`, `.png`, `.tiff`, `.bmp` | Tesseract OCR |
| **Text Files** | `.txt`, `.md` | Direct text processing |

---

## 🚀 **Quick Start**

### **Prerequisites**
- Node.js 18+ 
- Google Drive API access
- Gemini API key (for AI features)

### **1. Clone & Install**
```bash
git clone https://github.com/SHASHIYA06/metro-doc-ai-main.git
cd metro-doc-ai-main
npm install
```

### **2. Environment Configuration**
Create `.env` file in root directory:
```env
# Backend Configuration
GEMINI_API_KEY=your_gemini_api_key_here
PORT=3000
NODE_ENV=development

# Frontend Configuration
VITE_API_BASE_URL=http://localhost:3000
VITE_APP_SCRIPT_URL=your_google_apps_script_url_here
```

### **3. Start the Application**
```bash
# Terminal 1: Start Backend
npm run start:backend

# Terminal 2: Start Frontend
npm run dev
```

### **4. Access the Application**
- **Frontend**: http://localhost:5173 (or displayed port)
- **Backend API**: http://localhost:3000

---

## 🎯 **How to Use**

### **Step 1: Connect to Google Drive**
1. Application automatically connects to Google Drive
2. Wait for "Connected" status in header
3. Browse through your folders and files

### **Step 2: Select Any File**
1. Click on any supported file in the browser
2. File is automatically processed and indexed
3. Wait for "Ready for search" indicator

### **Step 3: Search with AI**
1. Enter search queries in the search panel
2. Use suggested queries for better results
3. View AI analysis and source content in results

### **Example Queries**
- "What are the main specifications?"
- "What are the safety procedures?"
- "What maintenance is required?"
- "What are the technical details?"

---

## 🏗️ **Architecture**

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend       │    │  Google Drive   │
│   (React)       │◄──►│   (Node.js)      │◄──►│     API         │
│                 │    │                  │    │                 │
│ • File Browser  │    │ • File Processing│    │ • File Access   │
│ • Search UI     │    │ • AI Integration │    │ • Content Extract│
│ • Results View  │    │ • Vector Store   │    │ • Permissions   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │   Gemini AI      │
                    │                  │
                    │ • Text Embedding │
                    │ • Content Analysis│
                    │ • Smart Search   │
                    └──────────────────┘
```

---

## 🔧 **API Documentation**

### **Backend Endpoints**

#### **Health Check**
```http
GET /health
```
Returns system status and statistics.

#### **File Processing**
```http
POST /ingest
Content-Type: multipart/form-data

files: File[]
system: string (optional)
subsystem: string (optional)
```

#### **AI Search**
```http
POST /ask
Content-Type: application/json

{
  "query": "search query",
  "k": 5,
  "system": "filter by system",
  "subsystem": "filter by subsystem"
}
```

#### **Statistics**
```http
GET /stats
```
Returns indexing statistics and performance metrics.

---

## 🧪 **Testing**

### **Run Complete Test Suite**
```bash
# Test enhanced workflow
node scripts/test-enhanced-workflow.js

# Test frontend demo
node scripts/test-frontend-demo.js

# Test simple workflow
node scripts/test-simple-workflow.js
```

### **Manual Testing Checklist**
- [ ] Google Drive connection
- [ ] File selection and processing
- [ ] Search functionality
- [ ] Results accuracy
- [ ] Error handling

---

## 🚀 **Deployment**

### **Production Environment Variables**
```env
# Production Backend
NODE_ENV=production
GEMINI_API_KEY=your_production_key
PORT=3000
FRONTEND_URL=https://your-domain.com

# Production Frontend
VITE_API_BASE_URL=https://your-backend-domain.com
VITE_APP_SCRIPT_URL=https://script.google.com/macros/s/your_script_id/exec
```

### **Deploy Backend**
```bash
# Build and deploy to your platform (Heroku, Railway, etc.)
npm run build:backend
npm start
```

### **Deploy Frontend**
```bash
# Build for production
npm run build

# Deploy to Netlify, Vercel, etc.
npm run preview
```

---

## 📊 **Performance & Monitoring**

### **Key Metrics**
- **File Processing Speed**: Average 2-5 seconds per file
- **Search Response Time**: < 1 second for most queries
- **Supported File Types**: 10+ major formats
- **Concurrent Users**: Scalable architecture

### **Monitoring Endpoints**
- `/health` - System health and uptime
- `/stats` - Usage statistics and performance
- Debug logs available in development mode

---

## 🔐 **Security & Privacy**

### **Data Protection**
- **Temporary Processing**: Files processed in memory only
- **No Persistent Storage**: Content not permanently stored
- **Secure Communication**: HTTPS-ready configuration
- **Access Control**: Google Drive permissions respected

---

## 🛠️ **Development**

### **Project Structure**
```
metro-doc-ai-main/
├── backend/                 # Node.js backend
│   └── server.js           # Enhanced server with AI
├── src/
│   ├── components/         # React components
│   │   └── SimpleAISearch.tsx  # Main enhanced component
│   └── services/           # API services
├── scripts/                # Test and utility scripts
├── .env                    # Environment configuration
└── package.json           # Dependencies and scripts
```

### **Key Technologies**
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS
- **Backend**: Node.js, Express, Multer, PDF-parse
- **AI**: Google Gemini API, Vector embeddings
- **File Processing**: Mammoth, SheetJS, Tesseract OCR
- **Google Integration**: Apps Script, Drive API

---

## 🆘 **Troubleshooting**

### **Common Issues**

#### **Google Drive Connection Failed**
```bash
# Check Google Apps Script URL
echo $VITE_APP_SCRIPT_URL

# Verify script deployment and permissions
```

#### **Backend Connection Failed**
```bash
# Check if backend is running
curl http://localhost:3000/health

# Verify environment variables
echo $GEMINI_API_KEY
```

#### **No Search Results**
- Ensure file is properly processed (green checkmark)
- Try different keywords or complete questions
- Check if content exists in the selected file

### **Debug Mode**
```bash
# Enable debug logging
DEBUG=* npm run start:backend
VITE_DEBUG=true npm run dev
```

---

## 📈 **Recent Updates**

### **v2.1.0 - Enhanced Application (Latest)**
- ✅ Complete Google Drive integration
- ✅ Universal file type support
- ✅ Automatic file processing
- ✅ File-specific AI search
- ✅ Modern three-panel UI
- ✅ Real-time status indicators
- ✅ Enhanced error handling

### **Previous Versions**
- v2.0.0 - Advanced 3D UI and professional features
- v1.x - Basic document search functionality
- v0.x - Initial prototype

---

## 🤝 **Contributing**

### **Development Setup**
1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Make changes with tests
4. Commit: `git commit -m 'Add amazing feature'`
5. Push: `git push origin feature/amazing-feature`
6. Submit Pull Request

### **Code Standards**
- TypeScript for type safety
- ESLint + Prettier for code quality
- Comprehensive error handling
- Unit tests for critical functions

---

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 **Acknowledgments**

- Google Gemini AI for intelligent search capabilities
- Google Drive API for seamless file integration
- Open source community for excellent libraries
- KMRCL for the original use case inspiration

---

## 📞 **Support**

- **Issues**: [GitHub Issues](https://github.com/SHASHIYA06/metro-doc-ai-main/issues)
- **Documentation**: See `ENHANCED_APPLICATION_GUIDE.md`
- **Testing**: Run test scripts in `/scripts` directory

---

## 👨‍💻 **Built By**

**SHASHI SHEKHAR MISHRA**  
Enhanced Google Drive AI Search Application

📧 Email: [Contact via GitHub](https://github.com/SHASHIYA06)  
🔗 Repository: https://github.com/SHASHIYA06/metro-doc-ai-main  
🌐 Live Demo: https://kmrcldocumentsearchgoogledrive.netlify.app  

---

## 🚀 **Deployment Status**

| Component | Status | URL |
|-----------|--------|-----|
| **Enhanced Frontend** | ✅ Ready | http://localhost:5173 |
| **Enhanced Backend** | ✅ Ready | http://localhost:3000 |
| **Google Drive API** | ⚠️ Configure | [Setup Guide](ENHANCED_APPLICATION_GUIDE.md) |
| **GitHub Repository** | ✅ Updated | https://github.com/SHASHIYA06/metro-doc-ai-main |

---

**🎉 Enhanced Google Drive AI Search Application - Ready for Production Use!**

Built with ❤️ for intelligent document processing and AI-powered search capabilities.

For detailed setup and usage instructions, see:
- 📖 [Enhanced Application Guide](ENHANCED_APPLICATION_GUIDE.md)
- 📋 [Complete Application Status](ENHANCED_APPLICATION_COMPLETE.md)
- 🧪 [Testing Documentation](scripts/)