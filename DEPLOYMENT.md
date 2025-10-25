# 🚀 KMRCL Metro Document Intelligence - Cloud Deployment Guide

This guide covers deploying the frontend to **Netlify** and backend to **Render** for production use.

## 📋 Prerequisites

- Node.js 18+ installed locally (for development)
- Google Gemini API key ([Get one here](https://makersuite.google.com/app/apikey))
- GitHub account (for code repository)
- Netlify account (for frontend hosting)
- Render account (for backend hosting)

## 🔧 Local Development Setup

### Quick Start (Recommended)

1. **Clone and setup**
   ```bash
   git clone <repository-url>
   cd kmrcl-metro-intelligence
   ```

2. **Run the startup script**
   
   **Linux/Mac:**
   ```bash
   ./start-dev.sh
   ```
   
   **Windows:**
   ```cmd
   start-dev.bat
   ```

3. **Configure API key**
   - Edit `backend/.env`
   - Add your Gemini API key: `GEMINI_API_KEY=your_key_here`

4. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3000

### Manual Setup

1. **Install dependencies**
   ```bash
   # Frontend
   npm install
   
   # Backend
   cd backend
   npm install
   cd ..
   ```

2. **Configure environment**
   ```bash
   cp backend/.env.example backend/.env
   # Edit backend/.env with your settings
   ```

3. **Start servers**
   ```bash
   # Terminal 1: Backend
   cd backend
   npm start
   
   # Terminal 2: Frontend
   npm run dev
   ```

## 🌐 Cloud Deployment (Recommended)

### Step 1: Deploy Backend to Render

1. **Create Render Account**
   - Go to [render.com](https://render.com) and sign up
   - Connect your GitHub account

2. **Create New Web Service**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Configure the service:
     ```
     Name: kmrcl-backend
     Environment: Node
     Region: Choose closest to your users
     Branch: main
     Root Directory: backend
     Build Command: npm install
     Start Command: npm start
     ```

3. **Set Environment Variables**
   ```
   NODE_ENV=production
   GEMINI_API_KEY=your_gemini_api_key_here
   FRONTEND_URL=https://your-netlify-site.netlify.app
   PORT=3000
   ```

4. **Deploy**
   - Click "Create Web Service"
   - Wait for deployment (usually 2-3 minutes)
   - Note your backend URL: `https://kmrcl-backend.onrender.com`

### Step 2: Deploy Frontend to Netlify

1. **Create Netlify Account**
   - Go to [netlify.com](https://netlify.com) and sign up
   - Connect your GitHub account

2. **Deploy from GitHub**
   - Click "New site from Git"
   - Choose GitHub and select your repository
   - Configure build settings:
     ```
     Branch: main
     Build command: npm run build
     Publish directory: dist
     ```

3. **Set Environment Variables**
   - Go to Site settings → Environment variables
   - Add:
     ```
     VITE_API_BASE_URL=https://your-render-backend-url.onrender.com
     VITE_APP_NAME=KMRCL Metro Document Intelligence
     VITE_APP_VERSION=2.0.0
     ```

4. **Deploy**
   - Click "Deploy site"
   - Wait for deployment (usually 1-2 minutes)
   - Your site will be available at: `https://your-site-name.netlify.app`

### Step 3: Update Backend CORS

1. **Update Backend Environment**
   - Go back to your Render dashboard
   - Update the `FRONTEND_URL` environment variable with your actual Netlify URL
   - The backend will automatically redeploy

### Step 4: Test the Deployment

1. **Visit your Netlify site**
2. **Check connection status** (should show "Connected")
3. **Upload a test document**
4. **Perform a search query**

## 🚀 Quick Deployment Commands

### Using Netlify CLI (Recommended)

1. **Install Netlify CLI**
   ```bash
   npm install -g netlify-cli
   ```

2. **Login to Netlify**
   ```bash
   netlify login
   ```

3. **Deploy**
   ```bash
   # Build and deploy
   npm run build
   netlify deploy --prod --dir=dist
   ```

### Manual Deployment

1. **Build locally**
   ```bash
   npm run build
   ```

2. **Upload dist folder to Netlify**
   - Drag and drop the `dist` folder to Netlify dashboard

## 🔧 Configuration Files

The following files are already configured for cloud deployment:

- `netlify.toml` - Netlify configuration
- `backend/render.yaml` - Render configuration  
- `.env.production` - Production environment variables
- `src/config/environment.ts` - Environment management

### Option 1: Traditional Server Deployment

1. **Prepare the server**
   ```bash
   # Install Node.js 18+
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   
   # Install PM2 for process management
   npm install -g pm2
   ```

2. **Deploy the application**
   ```bash
   # Clone repository
   git clone <repository-url>
   cd kmrcl-metro-intelligence
   
   # Install dependencies
   npm install
   cd backend && npm install && cd ..
   
   # Build frontend
   npm run build
   ```

3. **Configure production environment**
   ```bash
   # Backend configuration
   cat > backend/.env << EOF
   NODE_ENV=production
   PORT=3000
   GEMINI_API_KEY=your_production_api_key
   FRONTEND_URL=https://your-domain.com
   EOF
   ```

4. **Start with PM2**
   ```bash
   # Start backend
   cd backend
   pm2 start server.js --name "kmrcl-backend"
   
   # Serve frontend (using a simple static server)
   cd ..
   pm2 serve dist 5173 --name "kmrcl-frontend"
   
   # Save PM2 configuration
   pm2 save
   pm2 startup
   ```

### Option 2: Docker Deployment

1. **Create Dockerfile for backend**
   ```dockerfile
   # backend/Dockerfile
   FROM node:18-alpine
   
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci --only=production
   
   COPY . .
   
   EXPOSE 3000
   CMD ["npm", "start"]
   ```

2. **Create Dockerfile for frontend**
   ```dockerfile
   # Dockerfile
   FROM node:18-alpine as builder
   
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci
   
   COPY . .
   RUN npm run build
   
   FROM nginx:alpine
   COPY --from=builder /app/dist /usr/share/nginx/html
   COPY nginx.conf /etc/nginx/nginx.conf
   
   EXPOSE 80
   CMD ["nginx", "-g", "daemon off;"]
   ```

3. **Create docker-compose.yml**
   ```yaml
   version: '3.8'
   
   services:
     backend:
       build: ./backend
       ports:
         - "3000:3000"
       environment:
         - NODE_ENV=production
         - GEMINI_API_KEY=${GEMINI_API_KEY}
       volumes:
         - ./backend/uploads:/app/uploads
   
     frontend:
       build: .
       ports:
         - "80:80"
       depends_on:
         - backend
   ```

4. **Deploy with Docker**
   ```bash
   # Set environment variables
   export GEMINI_API_KEY=your_api_key
   
   # Build and start
   docker-compose up --build -d
   ```

### Option 3: Cloud Platform Deployment

#### Render.com (Recommended for simplicity)

1. **Backend deployment**
   - Connect your GitHub repository
   - Set build command: `cd backend && npm install`
   - Set start command: `cd backend && npm start`
   - Add environment variable: `GEMINI_API_KEY`

2. **Frontend deployment**
   - Create new static site
   - Set build command: `npm install && npm run build`
   - Set publish directory: `dist`

#### Vercel (Frontend) + Railway (Backend)

1. **Frontend on Vercel**
   ```bash
   npm install -g vercel
   vercel --prod
   ```

2. **Backend on Railway**
   - Connect GitHub repository
   - Set root directory to `backend`
   - Add `GEMINI_API_KEY` environment variable

#### AWS/Google Cloud/Azure

Detailed cloud deployment guides available in the `/docs/cloud-deployment/` folder.

## 🔒 Security Considerations

### Production Security Checklist

- [ ] Use HTTPS in production
- [ ] Set secure CORS origins
- [ ] Implement rate limiting
- [ ] Use environment variables for secrets
- [ ] Enable request logging
- [ ] Set up monitoring and alerts
- [ ] Regular security updates

### Environment Variables

```env
# Required
GEMINI_API_KEY=your_gemini_api_key

# Security
NODE_ENV=production
CORS_ORIGIN=https://your-domain.com
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=100

# Performance
MAX_FILE_SIZE=50MB
MAX_CONCURRENT_EXTRACTIONS=3
EXTRACTION_TIMEOUT=300000
```

## 📊 Monitoring and Maintenance

### Health Checks

The application provides health check endpoints:

- `GET /health` - Server status and metrics
- `GET /stats` - Document index statistics

### Log Management

```bash
# View PM2 logs
pm2 logs

# View specific service logs
pm2 logs kmrcl-backend
pm2 logs kmrcl-frontend
```

### Performance Monitoring

Monitor these key metrics:
- Response times for search queries
- Document processing times
- Memory usage
- Disk space (for uploads)
- API rate limits

### Backup Strategy

1. **Document Index**: The vector store is in-memory by default
2. **Uploaded Files**: Backup the `uploads/` directory
3. **Configuration**: Backup environment files
4. **Application Code**: Use version control

## 🔄 Updates and Maintenance

### Updating the Application

1. **Pull latest changes**
   ```bash
   git pull origin main
   ```

2. **Update dependencies**
   ```bash
   npm install
   cd backend && npm install && cd ..
   ```

3. **Rebuild and restart**
   ```bash
   npm run build
   pm2 restart all
   ```

### Database Migration

If switching from in-memory to persistent storage:

1. Export current index: `GET /stats`
2. Update configuration
3. Re-index documents: `POST /ingest`

## 🆘 Troubleshooting

### Common Issues

1. **"Gemini API key not found"**
   - Check `backend/.env` file
   - Verify API key is valid

2. **"CORS error"**
   - Update `FRONTEND_URL` in backend/.env
   - Check CORS configuration

3. **"Out of memory"**
   - Reduce `CHUNK_SIZE` and `MAX_SNIPPETS`
   - Increase server memory

4. **"File upload fails"**
   - Check `MAX_FILE_SIZE` setting
   - Verify disk space
   - Check file permissions

### Performance Optimization

1. **Slow search responses**
   - Reduce `MAX_SNIPPETS`
   - Implement result caching
   - Use faster embedding models

2. **High memory usage**
   - Implement persistent vector storage
   - Reduce chunk overlap
   - Clear old documents regularly

### Support

For deployment issues:
1. Check the logs first
2. Verify all environment variables
3. Test API endpoints manually
4. Create an issue with detailed error information

---

**Need help?** Create an issue in the repository with your deployment details and error logs.