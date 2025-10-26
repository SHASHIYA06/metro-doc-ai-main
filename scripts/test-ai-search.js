#!/usr/bin/env node

/**
 * Test AI Search functionality
 */

import fetch from 'node-fetch';

const BACKEND_URL = 'https://metro-doc-ai-main.onrender.com';

console.log('🧪 Testing AI Search Functionality\n');

async function testAISearch() {
  try {
    // Test 1: Backend Health Check
    console.log('1️⃣ Testing backend health...');
    const healthResponse = await fetch(`${BACKEND_URL}/health`);
    
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('   ✅ Backend is healthy:', healthData.ok);
    } else {
      console.log('   ❌ Backend health check failed:', healthResponse.status);
      return false;
    }

    // Test 2: Backend Stats
    console.log('\n2️⃣ Testing backend stats...');
    const statsResponse = await fetch(`${BACKEND_URL}/stats`);
    
    if (statsResponse.ok) {
      const statsData = await statsResponse.json();
      console.log('   ✅ Backend stats:', {
        totalFiles: statsData.totalFiles,
        totalChunks: statsData.totalChunks
      });
    } else {
      console.log('   ❌ Backend stats failed:', statsResponse.status);
    }

    // Test 3: AI Search Query
    console.log('\n3️⃣ Testing AI search query...');
    const searchResponse = await fetch(`${BACKEND_URL}/ask`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query: 'What are the technical specifications?',
        k: 5
      })
    });

    if (searchResponse.ok) {
      const searchData = await searchResponse.json();
      console.log('   ✅ AI search successful');
      console.log('   Response keys:', Object.keys(searchData));
      console.log('   Answer length:', searchData.answer?.length || 0);
      console.log('   Sources count:', searchData.sources?.length || 0);
    } else {
      const errorText = await searchResponse.text();
      console.log('   ❌ AI search failed:', searchResponse.status, errorText);
    }

    return true;
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

// Run the test
testAISearch().then(success => {
  if (success) {
    console.log('\n🎉 AI Search tests completed!');
    console.log('\n📋 Next steps:');
    console.log('1. Deploy your application to Netlify/Render');
    console.log('2. Test the AI search in the live application');
    console.log('3. Select files from Google Drive and analyze them');
  } else {
    console.log('\n⚠️ Some tests failed. Check the backend deployment.');
  }
}).catch(console.error);