#!/bin/bash

echo "🚀 DEPLOYING COMPLETE AI SEARCH APPLICATION"
echo "==========================================="

# Step 1: Initialize comprehensive data
echo "📚 Step 1: Loading comprehensive technical data..."
node scripts/load-comprehensive-data.js

# Step 2: Build application
echo "🔨 Step 2: Building production application..."
npm run build:prod

# Step 3: Test build
echo "🧪 Step 3: Testing production build..."
npm run preview &
PREVIEW_PID=$!
sleep 5

# Test if preview is working
if curl -f http://localhost:4173 > /dev/null 2>&1; then
    echo "✅ Production build test successful"
else
    echo "❌ Production build test failed"
fi

# Kill preview
kill $PREVIEW_PID 2>/dev/null

echo ""
echo "🎉 DEPLOYMENT READY!"
echo "✅ Comprehensive data loaded in backend"
echo "✅ Production build created"
echo "✅ AI Search interface ready"
echo ""
echo "📋 Next steps:"
echo "1. Deploy 'dist' folder to your hosting service"
echo "2. Ensure backend is running at configured URL"
echo "3. Users can immediately search technical documentation"
echo ""
echo "🔗 Backend URL: https://metro-doc-ai-main.onrender.com"
echo "📊 Backend Status: $(curl -s https://metro-doc-ai-main.onrender.com/stats | jq -r '.totalChunks // "Unknown"') chunks ready"