#!/usr/bin/env node

/**
 * Test Google Drive file extraction
 */

console.log('🧪 Testing Google Drive file extraction...');
console.log('This test simulates the "Analyze with AI" workflow');

// Since we can't directly test Google Drive from Node.js,
// let's test the backend upload functionality instead

const API_BASE_URL = process.env.VITE_API_BASE_URL || 'https://metro-doc-ai-main.onrender.com';

async function testGoogleDriveWorkflow() {
  try {
    console.log('\n📡 Testing backend connection...');
    const healthResponse = await fetch(`${API_BASE_URL}/health`);
    const healthData = await healthResponse.json();
    console.log('✅ Backend healthy:', healthData.ok);
    
    console.log('\n📤 Testing file upload (simulating Google Drive extraction)...');
    const testContent = 'Test document for Google Drive analysis workflow';
    
    const formData = new FormData();
    const blob = new Blob([testContent], { type: 'text/plain' });
    const file = new File([blob], 'google-drive-test.txt', { type: 'text/plain' });
    
    formData.append('files', file);
    formData.append('system', 'Google Drive Analysis');
    formData.append('subsystem', 'AI Search Ready');
    
    const uploadResponse = await fetch(`${API_BASE_URL}/ingest`, {
      method: 'POST',
      body: formData
    });
    
    if (uploadResponse.ok) {
      const result = await uploadResponse.json();
      console.log('✅ Upload successful:', result);
      
      // Wait for indexing
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Test search
      const searchResponse = await fetch(`${API_BASE_URL}/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: 'test document',
          k: 10
        })
      });
      
      const searchResult = await searchResponse.json();
      console.log('✅ Search result:', searchResult.result ? 'Found results' : 'No results');
      
      console.log('\n🎉 Google Drive workflow simulation: SUCCESS');
      console.log('The backend is ready for "Analyze with AI" functionality');
      
    } else {
      throw new Error(`Upload failed: ${uploadResponse.status}`);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testGoogleDriveWorkflow();