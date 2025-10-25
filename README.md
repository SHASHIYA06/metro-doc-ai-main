# 🚇 KMRCL Metro Document Intelligence

An advanced AI-powered document search and analysis system specifically designed for metro railway engineering documentation. Built for **SHASHI SHEKHAR MISHRA** with cutting-edge RAG (Retrieval-Augmented Generation) technology.

![KMRCL Metro Intelligence](https://img.shields.io/badge/KMRCL-Metro%20Intelligence-blue?style=for-the-badge&logo=train)
![React](https://img.shields.io/badge/React-18.3.1-61DAFB?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-3178C6?style=for-the-badge&logo=typescript)
![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js)

## ✨ Features

### 🔍 Advanced Document Processing
- **Multi-format Support**: PDF, DOCX, XLSX, CSV, Images (PNG, JPG, TIFF, BMP)
- **Intelligent OCR**: Automatic text extraction from scanned documents and images
- **Smart Chunking**: Context-aware text segmentation with overlap for better continuity
- **Metadata Extraction**: Automatic extraction of part numbers, voltages, currents, and technical specifications

### 🧠 AI-Powered Search
- **Vector Search**: Semantic similarity search using Google Gemini embeddings
- **RAG Technology**: Retrieval-Augmented Generation for accurate, context-aware responses
- **Multi-modal Analysis**: Text, image, and structured data processing
- **Technical Expertise**: Specialized for metro engineering terminology and concepts

### 🎨 Modern UI/UX
- **Glass Morphism Design**: Beautiful, modern interface with backdrop blur effects
- **Responsive Layout**: Works seamlessly on desktop, tablet, and mobile devices
- **Real-time Feedback**: Live upload progress, processing status, and search results
- **Interactive Animations**: Smooth transitions and engaging visual effects

### 🔧 Engineering-Focused
- **System Classification**: Organize documents by system (Rolling Stock, Infrastructure, etc.)
- **Subsystem Filtering**: Filter by subsystem (Doors, HVAC, Traction, Safety, etc.)
- **Technical Metadata**: Extract and search by part numbers, specifications, and technical details
- **Safety Emphasis**: Highlight safety-critical information and procedures

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Google Gemini API key

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd kmrcl-metro-intelligence
   ```

2. **Install frontend dependencies**
   ```bash
   npm install
   ```

3. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

4. **Configure environment variables**
   ```bash
   # Backend configuration
   cp backend/.env.example backend/.env
   # Edit backend/.env and add your Gemini API key
   ```

5. **Start the development servers**
   ```bash
   # Terminal 1: Start backend
   cd backend
   npm start

   # Terminal 2: Start frontend
   npm run dev
   ```

6. **Open your browser**
   Navigate to `http://localhost:5173`

## 📁 Project Structure

```
kmrcl-metro-intelligence/
├── src/                          # Frontend React application
│   ├── components/              # React components
│   │   ├── MetroDashboard.tsx   # Main dashboard component
│   │   ├── MetroBackground.tsx  # Animated background
│   │   └── ui/                  # Reusable UI components
│   ├── hooks/                   # Custom React hooks
│   ├── lib/                     # Utility functions
│   └── types/                   # TypeScript type definitions
├── backend/                     # Node.js backend server
│   ├── server.js               # Main server file
│   ├── package.json            # Backend dependencies
│   └── uploads/                # Temporary file storage
├── public/                     # Static assets
└── docs/                       # Documentation
```

## 🔧 Configuration

### Backend Configuration (backend/.env)

```env
# Required: Gemini AI API Key
GEMINI_API_KEY=your_gemini_api_key_here

# Server settings
PORT=3000
FRONTEND_URL=http://localhost:5173

# RAG Configuration
CHUNK_SIZE=1500
CHUNK_OVERLAP=300
MAX_SNIPPETS=15
SIMILARITY_THRESHOLD=0.7
```

### Frontend Configuration

The frontend automatically connects to the backend at `http://localhost:3000`. Update the API URL in the components if needed.

## 📖 Usage Guide

### 1. Document Upload
- **Drag & Drop**: Simply drag files onto the upload area
- **File Selection**: Click to browse and select multiple files
- **System Classification**: Specify system (e.g., "Rolling Stock") and subsystem (e.g., "Doors")
- **Batch Processing**: Upload multiple files simultaneously

### 2. AI Search
- **Natural Language**: Ask questions in plain English
- **Technical Queries**: Search for specific components, specifications, or procedures
- **System Filtering**: Filter results by system and subsystem
- **Contextual Results**: Get relevant excerpts with source citations

### 3. Search Types

#### AI Search
```
"Show me door control unit specifications"
"Find HVAC maintenance procedures"
"What are the safety requirements for traction motors?"
```

#### Architecture Search
```
"Find circuit diagrams for door control systems"
"Show me the wiring layout for HVAC controllers"
```

#### Structured Search
Filter by system and subsystem for organized browsing.

#### Keyword Search
Traditional keyword-based search through OCR text.

## 🛠️ API Endpoints

### Document Processing
- `POST /ingest` - Upload and process documents
- `POST /clear` - Clear the document index

### Search & Retrieval
- `POST /ask` - AI-powered question answering
- `POST /search-multi` - Multi-document search
- `POST /search-by-tags` - Tag-based search

### System Information
- `GET /health` - Server health check
- `GET /stats` - Index statistics and metrics

## 🎨 UI Components

### Glass Morphism Effects
The application uses modern glass morphism design with:
- Backdrop blur effects
- Semi-transparent backgrounds
- Subtle borders and shadows
- Smooth animations and transitions

### Responsive Design
- Mobile-first approach
- Adaptive layouts for all screen sizes
- Touch-friendly interactions
- Optimized performance

## 🔍 Technical Details

### Document Processing Pipeline
1. **File Upload**: Multi-format file handling with validation
2. **Text Extraction**: Format-specific extraction (PDF, DOCX, OCR for images)
3. **Preprocessing**: Text cleaning and normalization
4. **Chunking**: Smart text segmentation with context preservation
5. **Embedding**: Vector generation using Google Gemini
6. **Indexing**: Storage in optimized vector database

### Search Algorithm
1. **Query Processing**: Natural language understanding
2. **Vector Search**: Semantic similarity matching
3. **Filtering**: System/subsystem/tag-based filtering
4. **Ranking**: Multi-factor scoring with relevance boosting
5. **Response Generation**: Context-aware answer synthesis

### Performance Optimizations
- Efficient chunking strategies
- Optimized vector operations
- Caching for repeated queries
- Batch processing for uploads
- Progressive loading for large datasets

## 🚀 Deployment

### Production Build
```bash
# Build frontend
npm run build

# Start backend in production
cd backend
NODE_ENV=production npm start
```

### Docker Deployment
```bash
# Build and run with Docker
docker-compose up --build
```

### Environment Variables for Production
```env
NODE_ENV=production
FRONTEND_URL=https://your-domain.com
GEMINI_API_KEY=your_production_api_key
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**SHASHI SHEKHAR MISHRA**
- Specialized in metro railway engineering systems
- Expert in document management and technical analysis
- Focused on safety-critical transportation infrastructure

## 🙏 Acknowledgments

- Google Gemini AI for advanced language processing
- React and TypeScript communities
- Metro engineering professionals who provided domain expertise
- Open source contributors who made this project possible

## 📞 Support

For technical support or questions about metro engineering applications:
- Create an issue in this repository
- Contact the development team
- Refer to the documentation in the `/docs` folder

---

**Built with ❤️ for Metro Engineering Excellence**

*Enhancing safety, efficiency, and reliability in metro transportation systems through intelligent document management.*