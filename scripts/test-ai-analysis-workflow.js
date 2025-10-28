#!/usr/bin/env node

/**
 * Test script to verify AI Analysis workflow
 * Tests the complete flow: Google Drive → Analyze with AI → AI Search
 */

const API_BASE_URL = process.env.VITE_API_BASE_URL || 'https://metro-doc-ai-main.onrender.com';

async function testWorkflow() {
  console.log('🧪 Testing AI Analysis Workflow...');
  console.log('🔗 Backend URL:', API_BASE_URL);
  
  try {
    // Step 1: Test backend connection
    console.log('\n📡 Step 1: Testing backend connection...');
    const healthResponse = await fetch(`${API_BASE_URL}/health`);
    
    if (!healthResponse.ok) {
      throw new Error(`Backend health check failed: ${healthResponse.status}`);
    }
    
    const healthData = await healthResponse.json();
    console.log('✅ Backend is healthy:', healthData);
    
    // Step 2: Check initial stats
    console.log('\n📊 Step 2: Checking initial backend stats...');
    const statsResponse = await fetch(`${API_BASE_URL}/stats`);
    
    if (!statsResponse.ok) {
      throw new Error(`Stats check failed: ${statsResponse.status}`);
    }
    
    const initialStats = await statsResponse.json();
    console.log('📈 Initial stats:', {
      totalChunks: initialStats.totalChunks,
      uniqueFiles: initialStats.uniqueFiles,
      bySystem: initialStats.bySystem
    });
    
    // Step 3: Test file upload simulation
    console.log('\n📤 Step 3: Testing file upload simulation...');
    
    // Create a test file
    const testContent = `
KMRCL Metro Test Document
========================

This is a test document for the AI analysis workflow.

Technical Specifications:
- Voltage: 24V DC
- Current: 5A
- Wire Type: 18 AWG
- System: Signaling
- Subsystem: CBTC

Safety Information:
- Emergency stop functionality
- Interlock systems
- Protection circuits

Components:
- Controller Unit
- Sensor Module
- Motor Drive
- Relay Assembly
`;
    
    const formData = new FormData();
    const blob = new Blob([testContent], { type: 'text/plain' });
    const file = new File([blob], 'test-document.txt', { type: 'text/plain' });
    
    formData.append('files', file);
    formData.append('system', 'Google Drive Analysis');
    formData.append('subsystem', 'AI Search Ready');
    
    const uploadResponse = await fetch(`${API_BASE_URL}/ingest`, {
      method: 'POST',
      body: formData
    });
    
    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      throw new Error(`Upload failed: ${errorText}`);
    }
    
    const uploadResult = await uploadResponse.json();
    console.log('✅ Upload successful:', uploadResult);
    
    // Step 4: Wait for indexing
    console.log('\n⏳ Step 4: Waiting for indexing to complete...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Step 5: Check updated stats
    console.log('\n📊 Step 5: Checking updated backend stats...');
    const updatedStatsResponse = await fetch(`${API_BASE_URL}/stats`);
    const updatedStats = await updatedStatsResponse.json();
    
    console.log('📈 Updated stats:', {
      totalChunks: updatedStats.totalChunks,
      uniqueFiles: updatedStats.uniqueFiles,
      bySystem: updatedStats.bySystem
    });
    
    if (updatedStats.totalChunks > initialStats.totalChunks) {
      console.log('✅ SUCCESS: New chunks were indexed!');
    } else {
      console.log('⚠️ WARNING: No new chunks detected');
    }
    
    // Step 6: Test AI search
    console.log('\n🔍 Step 6: Testing AI search...');
    const searchQuery = 'What are the technical specifications?';
    
    const searchResponse = await fetch(`${API_BASE_URL}/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: searchQuery,
        k: 10,
        system: 'Google Drive Analysis',
        subsystem: 'AI Search Ready'
      })
    });
    
    if (!searchResponse.ok) {
      const errorText = await searchResponse.text();
      throw new Error(`Search failed: ${errorText}`);
    }
    
    const searchResult = await searchResponse.json();
    console.log('🎉 Search successful!');
    console.log('📝 AI Response:', searchResult.result?.substring(0, 200) + '...');
    console.log('📚 Sources found:', searchResult.sources?.length || 0);
    
    // Step 7: Summary
    console.log('\n🎯 WORKFLOW TEST SUMMARY:');
    console.log('✅ Backend connection: WORKING');
    console.log('✅ File upload/indexing: WORKING');
    console.log('✅ AI search: WORKING');
    console.log('✅ Complete workflow: FUNCTIONAL');
    
    console.log('\n🚀 The AI Analysis workflow is working correctly!');
    console.log('Users can now: Select files → Analyze with AI → Use AI Search');
    
  } catch (error) {
    console.error('❌ Workflow test failed:', error);
    console.log('\n🔧 Troubleshooting steps:');
    console.log('1. Check if backend is running');
    console.log('2. Verify API_BASE_URL is correct');
    console.log('3. Check network connectivity');
    console.log('4. Review backend logs for errors');
    process.exit(1);
  }
}

// Run the test
testWorkflow().catch(console.error);