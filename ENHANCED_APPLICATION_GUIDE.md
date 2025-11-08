# 🚀 Enhanced Google Drive AI Search Application

## Overview

This is a comprehensive application that connects to Google Drive, allows users to select any file, and provides AI-powered search capabilities on the selected file's content. The system supports all major file types and provides intelligent search results.

## 🌟 Key Features

### ✅ Complete Google Drive Integration
- **Seamless Connection**: Automatic connection to Google Drive
- **File Browser**: Navigate through folders and files
- **Universal Support**: Supports PDFs, Docs, Sheets, Images, Text files, and more
- **Real-time Status**: Live connection and processing status

### ✅ Intelligent File Processing
- **Automatic Upload**: Selected files are automatically processed
- **Content Extraction**: Advanced text extraction from all file types
- **OCR Support**: Image and scanned PDF text recognition
- **Metadata Enhancement**: Automatic keyword and query suggestion generation

### ✅ Advanced AI Search
- **File-Specific Search**: Search only within the selected file
- **Smart Query Processing**: Automatic query enhancement for better results
- **Contextual Results**: Relevant information extraction with source references
- **Multiple Result Types**: AI analysis, source content, and suggestions

### ✅ Enhanced User Experience
- **Three-Panel Layout**: Files, Search, and Results in organized panels
- **Real-time Feedback**: Progress indicators and status updates
- **Suggested Queries**: Smart query suggestions based on content
- **Error Handling**: Comprehensive error messages and recovery suggestions

## 🏗️ Architecture

```
Frontend (React + TypeScript)
├── Enhanced UI Components
├── Google Drive Service
└── AI Search Interface

Backend (Node.js + Express)
├── File Processing Engine
├── AI Integration (Gemini)
├── Vector Database
└── Search API

Google Apps Script
├── Drive API Integration
├── File Access Management
└── Content Extraction
```

## 🚀 Quick Start

### 1. Prerequisites
```bash
# Node.js 18+ required
node --version

# Install dependencies
npm install
```

### 2. Environment Setup
Create `.env` file:
```env
# Backend Configuration
GEMINI_API_KEY=your_gemini_api_key_here
PORT=3000
NODE_ENV=development

# Frontend Configuration
VITE_API_BASE_URL=http://localhost:3000
VITE_APP_SCRIPT_URL=your_google_apps_script_url_here
```

### 3. Start the Application
```bash
# Start backend server
npm run start:backend

# Start frontend (in another terminal)
npm run dev

# Or start both together
npm run start:dev
```

### 4. Access the Application
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000

## 📋 Supported File Types

| File Type | Extension | Processing Method |
|-----------|-----------|-------------------|
| PDF Documents | `.pdf` | PDF.js + OCR fallback |
| Google Docs | `.gdoc` | Google Drive API |
| Google Sheets | `.gsheet` | Google Drive API |
| Word Documents | `.docx` | Mammoth.js |
| Excel Files | `.xlsx`, `.xls` | SheetJS |
| Text Files | `.txt`, `.md` | Direct reading |
| CSV Files | `.csv` | Structured parsing |
| Images | `.jpg`, `.png`, `.tiff` | Tesseract OCR |

## 🔍 How to Use

### Step 1: Connect to Google Drive
1. Application automatically connects to Google Drive
2. Wait for "Connected" status in the header
3. Browse through your folders and files

### Step 2: Select a File
1. Click on any supported file in the file browser
2. File will be automatically uploaded and processed
3. Wait for "Ready for search" status

### Step 3: Search with AI
1. Enter your search query in the search box
2. Use suggested queries for better results
3. View AI analysis and source content in results panel

### Example Queries
- "What are the main specifications?"
- "What are the safety procedures?"
- "What maintenance is required?"
- "What are the technical requirements?"

## 🛠️ API Endpoints

### Backend API

#### Health Check
```http
GET /health
```
Returns backend status and statistics.

#### File Upload
```http
POST /ingest
Content-Type: multipart/form-data

files: File[]
system: string (optional)
subsystem: string (optional)
```

#### AI Search
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

#### Statistics
```http
GET /stats
```
Returns indexing statistics and file information.

#### Clear Index
```http
POST /clear
```
Clears all indexed content.

### Google Apps Script API

#### List Folders
```http
GET {SCRIPT_URL}?action=listTree
```

#### List Files
```http
GET {SCRIPT_URL}?action=listFiles&folder={folderId}
```

#### Download File
```http
GET {SCRIPT_URL}?action=downloadBase64&fileId={fileId}
```

## 🧪 Testing

### Run Complete Workflow Test
```bash
node scripts/test-enhanced-workflow.js
```

This test verifies:
- ✅ Backend connection
- ✅ Google Drive connection
- ✅ File upload and processing
- ✅ AI search functionality
- ✅ End-to-end workflow

### Manual Testing Steps
1. **Connection Test**: Verify both backend and Google Drive connections
2. **File Selection**: Select different file types and verify processing
3. **Search Test**: Try various search queries and verify results
4. **Error Handling**: Test with unsupported files and invalid queries

## 🔧 Configuration

### Backend Configuration
```javascript
// backend/server.js
const CHUNK_SIZE = 1500;           // Text chunk size for processing
const CHUNK_OVERLAP = 300;         // Overlap between chunks
const MAX_SNIPPETS = 15;           // Maximum search results
const SIMILARITY_THRESHOLD = 0.3;  // Minimum similarity for results
```

### Frontend Configuration
```typescript
// src/components/SimpleAISearch.tsx
const SUPPORTED_FILE_TYPES = {
  'application/pdf': { icon: '📄', name: 'PDF Document' },
  // ... more file types
};
```

## 🚨 Troubleshooting

### Common Issues

#### 1. Google Drive Connection Failed
- **Cause**: Invalid Google Apps Script URL or permissions
- **Solution**: Verify VITE_APP_SCRIPT_URL and script deployment

#### 2. Backend Connection Failed
- **Cause**: Backend server not running or wrong URL
- **Solution**: Start backend server and verify VITE_API_BASE_URL

#### 3. File Processing Failed
- **Cause**: Unsupported file type or extraction error
- **Solution**: Check file type support and file integrity

#### 4. No Search Results
- **Cause**: File not properly indexed or query mismatch
- **Solution**: Wait for processing completion, try different queries

### Debug Mode
Enable debug logging:
```bash
# Backend
DEBUG=* npm run start:backend

# Frontend
VITE_DEBUG=true npm run dev
```

## 📊 Performance Optimization

### Backend Optimization
- **Chunking**: Optimal chunk size for better search accuracy
- **Caching**: In-memory vector store for fast retrieval
- **Parallel Processing**: Concurrent file processing
- **Error Recovery**: Graceful handling of processing failures

### Frontend Optimization
- **Lazy Loading**: Components loaded on demand
- **State Management**: Efficient React state updates
- **Error Boundaries**: Prevent UI crashes
- **Progressive Enhancement**: Graceful degradation

## 🔐 Security Considerations

### Data Privacy
- Files are processed temporarily and not permanently stored
- Content is indexed in memory only
- No persistent file storage on backend

### API Security
- CORS configuration for allowed origins
- Input validation and sanitization
- Rate limiting (recommended for production)
- Authentication (implement as needed)

## 🚀 Deployment

### Production Deployment

#### Backend (Node.js)
```bash
# Build and deploy to your preferred platform
npm run build:backend
npm run start:prod
```

#### Frontend (React)
```bash
# Build for production
npm run build

# Deploy to Netlify, Vercel, or your preferred platform
```

#### Environment Variables
```env
# Production Backend
NODE_ENV=production
GEMINI_API_KEY=your_production_key
PORT=3000
FRONTEND_URL=https://your-frontend-domain.com

# Production Frontend
VITE_API_BASE_URL=https://your-backend-domain.com
VITE_APP_SCRIPT_URL=https://script.google.com/macros/s/your_script_id/exec
```

## 📈 Monitoring and Analytics

### Health Monitoring
- Backend health endpoint: `/health`
- Statistics endpoint: `/stats`
- Error logging and tracking
- Performance metrics collection

### Usage Analytics
- Search query patterns
- File type usage statistics
- Processing time metrics
- User interaction tracking

## 🤝 Contributing

### Development Setup
1. Fork the repository
2. Create feature branch
3. Make changes with tests
4. Submit pull request

### Code Standards
- TypeScript for type safety
- ESLint for code quality
- Prettier for formatting
- Jest for testing

## 📄 License

This project is licensed under the MIT License. See LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the troubleshooting section
- Review the API documentation
- Run the test suite for diagnostics

---

**Built with ❤️ for enhanced document intelligence and AI-powered search capabilities.**