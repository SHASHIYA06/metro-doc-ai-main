@echo off
REM KMRCL Metro Document Intelligence - Development Startup Script (Windows)
REM This script starts both the frontend and backend servers

echo 🚇 Starting KMRCL Metro Document Intelligence...
echo ==================================================

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js 18+ first.
    pause
    exit /b 1
)

REM Check if npm is installed
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm is not installed. Please install npm first.
    pause
    exit /b 1
)

REM Create backend directory if it doesn't exist
if not exist "backend" (
    echo 📁 Creating backend directory...
    mkdir backend
)

REM Check if backend dependencies are installed
if not exist "backend\node_modules" (
    echo 📦 Installing backend dependencies...
    cd backend
    npm install
    cd ..
)

REM Check if frontend dependencies are installed
if not exist "node_modules" (
    echo 📦 Installing frontend dependencies...
    npm install
)

REM Check if .env file exists in backend
if not exist "backend\.env" (
    echo ⚠️  Backend .env file not found. Please create backend\.env with your Gemini API key
)

echo.
echo 🚀 Starting servers...
echo Frontend: http://localhost:5173
echo Backend:  http://localhost:3000
echo.
echo Press Ctrl+C to stop both servers
echo.

REM Start backend server
echo 🔧 Starting backend server...
start "KMRCL Backend" cmd /k "cd backend && npm start"

REM Wait a moment for backend to start
timeout /t 3 /nobreak >nul

REM Start frontend server
echo 🎨 Starting frontend server...
start "KMRCL Frontend" cmd /k "npm run dev"

echo.
echo ✅ Both servers are starting in separate windows
echo Close the command windows to stop the servers
pause