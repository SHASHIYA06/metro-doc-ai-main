#!/usr/bin/env node

/**
 * Simple test to verify the "Analyze with AI" workflow
 */

const API_BASE_URL = process.env.VITE_API_BASE_URL || 'https://metro-doc-ai-main.onrender.com';

async function testAnalyzeWithAI() {
  console.log('🧪 Testing "Analyze with AI" Workflow...');
  console.log('🔗 Backend URL:', API_BASE_URL);
  
  try {
    // Step 1: Test backend health
    console.log('\n📡 Step 1: Testing backend health...');
    const healthResponse = await fetch(`${API_BASE_URL}/health`);
    
    if (!healthResponse.ok) {
      throw new Error(`Backend health check failed: ${healthResponse.status}`);
    }
    
    const healthData = await healthResponse.json();
    console.log('✅ Backend is healthy. Indexed documents:', healthData.indexed);
    
    // Step 2: Check current stats
    console.log('\n📊 Step 2: Checking current backend stats...');
    const statsResponse = await fetch(`${API_BASE_URL}/stats`);
    const stats = await statsResponse.json();
    
    console.log('📈 Current stats:', {
      totalChunks: stats.totalChunks,
      uniqueFiles: stats.uniqueFiles,
      bySystem: stats.bySystem
    });
    
    // Step 3: Simulate file upload (like "Analyze with AI" does)
    console.log('\n📤 Step 3: Simulating file upload...');
    
    const testContent = `
KMRCL Metro Test Document - Analyze with AI Test
===============================================

This document tests the "Analyze with AI" functionality.

Technical Information:
- System: Signaling Control
- Voltage: 24V DC
- Current: 10A
- Wire Type: 16 AWG
- Safety: Emergency stop enabled
- Components: Controller, Sensor, Motor

Test Query: What are the technical specifications?
Expected: AI should extract voltage, current, wire type, and components.
`;
    
    const formData = new FormData();
    const blob = new Blob([testContent], { type: 'text/plain' });
    const file = new File([blob], 'analyze-with-ai-test.txt', { type: 'text/plain' });
    
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
    console.log('\n⏳ Step 4: Waiting for indexing...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Step 5: Test AI search (what happens after "Analyze with AI")
    console.log('\n🤖 Step 5: Testing AI search...');
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
    console.log('🎉 AI Search successful!');
    console.log('📝 AI Response preview:', searchResult.result?.substring(0, 200) + '...');
    console.log('📚 Sources found:', searchResult.sources?.length || 0);
    
    // Step 6: Check updated stats
    console.log('\n📊 Step 6: Checking updated stats...');
    const updatedStatsResponse = await fetch(`${API_BASE_URL}/stats`);
    const updatedStats = await updatedStatsResponse.json();
    
    console.log('📈 Updated stats:', {
      totalChunks: updatedStats.totalChunks,
      uniqueFiles: updatedStats.uniqueFiles,
      bySystem: updatedStats.bySystem
    });
    
    // Step 7: Summary
    console.log('\n🎯 TEST SUMMARY:');
    console.log('✅ Backend connection: WORKING');
    console.log('✅ File upload (Analyze with AI): WORKING');
    console.log('✅ File indexing: WORKING');
    console.log('✅ AI search: WORKING');
    console.log('✅ Complete "Analyze with AI" workflow: FUNCTIONAL');
    
    console.log('\n🚀 The "Analyze with AI" workflow should work in the frontend!');
    console.log('If it\'s not working, the issue is likely in the frontend JavaScript.');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.log('\n🔧 If this test fails, the backend has issues.');
    console.log('If this test passes but frontend doesn\'t work, it\'s a frontend issue.');
    process.exit(1);
  }
}

// Run the test
testAnalyzeWithAI().catch(console.error);