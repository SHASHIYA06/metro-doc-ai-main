#!/usr/bin/env node

// Enhanced Google Drive AI Search Workflow Test
// Tests the complete workflow: Google Drive → File Selection → AI Processing → Search

import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import FormData from 'form-data';

const config = {
  API_BASE_URL: process.env.VITE_API_BASE_URL || 'http://localhost:3000',
  GOOGLE_APPS_SCRIPT_URL: process.env.VITE_APP_SCRIPT_URL || 'https://script.google.com/macros/s/AKfycbwYour_Script_ID/exec'
};

console.log('🚀 ENHANCED GOOGLE DRIVE AI SEARCH WORKFLOW TEST');
console.log('================================================');
console.log(`Backend URL: ${config.API_BASE_URL}`);
console.log(`Google Apps Script URL: ${config.GOOGLE_APPS_SCRIPT_URL}`);
console.log('');

async function testBackendConnection() {
  console.log('🔧 Step 1: Testing Backend Connection...');
  try {
    const response = await fetch(`${config.API_BASE_URL}/health`);
    const data = await response.json();
    
    if (response.ok && data.ok) {
      console.log('✅ Backend connection successful');
      console.log(`   - Status: ${data.ok ? 'Healthy' : 'Unhealthy'}`);
      console.log(`   - Indexed chunks: ${data.indexed}`);
      console.log(`   - Uptime: ${Math.round(data.uptime)}s`);
      return true;
    } else {
      throw new Error(`Backend health check failed: ${response.status}`);
    }
  } catch (error) {
    console.log('❌ Backend connection failed:', error.message);
    return false;
  }
}

async function testGoogleDriveConnection() {
  console.log('🔧 Step 2: Testing Google Drive Connection...');
  try {
    const response = await fetch(`${config.GOOGLE_APPS_SCRIPT_URL}?action=listTree`);
    const data = await response.json();
    
    if (response.ok && data.ok) {
      console.log('✅ Google Drive connection successful');
      console.log(`   - Folders found: ${data.folders?.length || 0}`);
      if (data.folders?.length > 0) {
        console.log(`   - Sample folders: ${data.folders.slice(0, 3).map(f => f.name).join(', ')}`);
      }
      return true;
    } else {
      throw new Error(`Google Drive connection failed: ${data.error || 'Unknown error'}`);
    }
  } catch (error) {
    console.log('❌ Google Drive connection failed:', error.message);
    return false;
  }
}

async function clearBackend() {
  console.log('🧹 Step 3: Clearing Backend...');
  try {
    const response = await fetch(`${config.API_BASE_URL}/clear`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    const data = await response.json();
    if (response.ok && data.ok) {
      console.log('✅ Backend cleared successfully');
      return true;
    } else {
      throw new Error(`Clear failed: ${response.status}`);
    }
  } catch (error) {
    console.log('❌ Backend clear failed:', error.message);
    return false;
  }
}

async function simulateFileUpload() {
  console.log('📤 Step 4: Simulating Enhanced File Upload...');
  
  // Create enhanced test content that mimics Google Drive extraction
  const testContent = `DOCUMENT INFORMATION:
File Name: Enhanced-Test-Document.pdf
File Type: PDF Document
MIME Type: application/pdf
Size: 2048 KB
Modified: 2024-01-15T10:30:00Z

SEARCHABLE CONTENT:
Metro Railway Door System Specifications

1. DOOR CONTROL UNIT (DCU) SPECIFICATIONS
   - Operating Voltage: 110V DC
   - Control Logic: Microprocessor-based
   - Communication: CAN Bus protocol
   - Safety Features: Obstacle detection, Emergency override

2. DOOR MECHANISM DETAILS
   - Door Width: 1300mm standard, 1600mm wide doors
   - Opening Speed: 0.6 m/s ± 0.1 m/s
   - Closing Speed: 0.4 m/s ± 0.1 m/s
   - Door Weight: 85kg per door panel

3. SAFETY SYSTEMS
   - Light Curtain Protection: 25mm resolution
   - Force Limiting: Maximum 150N closing force
   - Emergency Release: Manual override capability
   - Backup Power: 30-minute battery backup

4. MAINTENANCE PROCEDURES
   - Daily Inspection: Visual check of door operation
   - Weekly Testing: Safety system verification
   - Monthly Service: Lubrication and adjustment
   - Annual Overhaul: Complete system inspection

5. TECHNICAL SPECIFICATIONS
   - Operating Temperature: -10°C to +50°C
   - Humidity Range: 5% to 95% non-condensing
   - Vibration Resistance: IEC 61373 Category 1
   - EMC Compliance: EN 50121-3-2

KEYWORDS: door control, DCU, safety systems, maintenance, specifications, metro railway
SUGGESTED QUERIES: What are the door specifications?; How does the safety system work?; What are the maintenance procedures?; What is the operating voltage?`;

  try {
    const formData = new FormData();
    
    // Create a buffer from the test content
    const buffer = Buffer.from(testContent, 'utf8');
    
    formData.append('files', buffer, {
      filename: 'Enhanced-Test-Document.pdf',
      contentType: 'text/plain'
    });
    formData.append('system', 'Selected File - Enhanced-Test-Document');
    formData.append('subsystem', 'Google Drive Upload');

    const response = await fetch(`${config.API_BASE_URL}/ingest`, {
      method: 'POST',
      body: formData
    });

    const result = await response.json();
    
    if (response.ok && result.ok) {
      console.log('✅ Enhanced file upload successful');
      console.log(`   - Files processed: ${result.results?.length || 0}`);
      console.log(`   - Chunks added: ${result.added}`);
      console.log(`   - Total chunks: ${result.total}`);
      
      if (result.results?.length > 0) {
        const fileResult = result.results[0];
        console.log(`   - File: ${fileResult.fileName}`);
        console.log(`   - Status: ${fileResult.status}`);
        console.log(`   - Content length: ${fileResult.contentLength} chars`);
        console.log(`   - Chunks created: ${fileResult.chunks}`);
      }
      
      return result;
    } else {
      throw new Error(`Upload failed: ${result.error || 'Unknown error'}`);
    }
  } catch (error) {
    console.log('❌ Enhanced file upload failed:', error.message);
    return null;
  }
}

async function waitForIndexing(seconds = 5) {
  console.log(`⏳ Step 5: Waiting for indexing (${seconds} seconds)...`);
  await new Promise(resolve => setTimeout(resolve, seconds * 1000));
  console.log('✅ Indexing wait complete');
}

async function verifyIndexing() {
  console.log('📊 Step 6: Verifying indexing...');
  try {
    const response = await fetch(`${config.API_BASE_URL}/stats`);
    const stats = await response.json();
    
    if (response.ok) {
      console.log('✅ Backend stats retrieved');
      console.log(`   - Total chunks: ${stats.totalChunks}`);
      console.log(`   - Unique files: ${stats.uniqueFiles}`);
      console.log(`   - Files: ${Object.keys(stats.byFile || {}).join(', ')}`);
      console.log(`   - Systems: ${Object.keys(stats.bySystem || {}).join(', ')}`);
      
      return stats.totalChunks > 0;
    } else {
      throw new Error(`Stats request failed: ${response.status}`);
    }
  } catch (error) {
    console.log('❌ Indexing verification failed:', error.message);
    return false;
  }
}

async function testEnhancedSearch() {
  console.log('🔍 Step 7: Testing Enhanced AI Search...');
  
  const testQueries = [
    {
      query: 'door specifications',
      description: 'Simple keyword search'
    },
    {
      query: 'What are the door control unit specifications?',
      description: 'Complete question format'
    },
    {
      query: 'safety systems',
      description: 'Safety-related search'
    },
    {
      query: 'What are the maintenance procedures?',
      description: 'Maintenance procedures query'
    },
    {
      query: 'operating voltage',
      description: 'Technical specification search'
    }
  ];

  let successCount = 0;
  
  for (const testQuery of testQueries) {
    console.log(`\n🔍 Testing: "${testQuery.query}" (${testQuery.description})`);
    
    try {
      const response = await fetch(`${config.API_BASE_URL}/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: testQuery.query,
          k: 5,
          system: 'Selected File - Enhanced-Test-Document',
          subsystem: 'Google Drive Upload'
        })
      });

      const searchData = await response.json();
      
      if (response.ok && searchData.result && !searchData.result.includes('No relevant documents found')) {
        console.log('✅ Search successful');
        console.log(`   - Result length: ${searchData.result.length} chars`);
        console.log(`   - Sources found: ${searchData.sources?.length || 0}`);
        console.log(`   - Used chunks: ${searchData.used}`);
        
        // Show preview of result
        const preview = searchData.result.substring(0, 200).replace(/\n/g, ' ');
        console.log(`   - Preview: "${preview}${searchData.result.length > 200 ? '...' : ''}"`);
        
        successCount++;
      } else {
        console.log('⚠️ No results found');
        console.log(`   - Response: ${searchData.result?.substring(0, 100) || 'No result'}`);
      }
    } catch (error) {
      console.log('❌ Search failed:', error.message);
    }
  }
  
  console.log(`\n📊 Search Results Summary: ${successCount}/${testQueries.length} queries successful`);
  return successCount > 0;
}

async function runEnhancedWorkflowTest() {
  console.log('🎯 Starting Enhanced Workflow Test...\n');
  
  const results = {
    backendConnection: false,
    googleDriveConnection: false,
    backendClear: false,
    fileUpload: false,
    indexingVerification: false,
    searchTest: false
  };

  // Test each step
  results.backendConnection = await testBackendConnection();
  console.log('');
  
  results.googleDriveConnection = await testGoogleDriveConnection();
  console.log('');
  
  if (results.backendConnection) {
    results.backendClear = await clearBackend();
    console.log('');
    
    const uploadResult = await simulateFileUpload();
    results.fileUpload = uploadResult !== null;
    console.log('');
    
    if (results.fileUpload) {
      await waitForIndexing();
      console.log('');
      
      results.indexingVerification = await verifyIndexing();
      console.log('');
      
      if (results.indexingVerification) {
        results.searchTest = await testEnhancedSearch();
      }
    }
  }

  // Final summary
  console.log('\n🏁 ENHANCED WORKFLOW TEST SUMMARY');
  console.log('=====================================');
  console.log(`✅ Backend Connection: ${results.backendConnection ? 'PASS' : 'FAIL'}`);
  console.log(`✅ Google Drive Connection: ${results.googleDriveConnection ? 'PASS' : 'FAIL'}`);
  console.log(`✅ Backend Clear: ${results.backendClear ? 'PASS' : 'FAIL'}`);
  console.log(`✅ Enhanced File Upload: ${results.fileUpload ? 'PASS' : 'FAIL'}`);
  console.log(`✅ Indexing Verification: ${results.indexingVerification ? 'PASS' : 'FAIL'}`);
  console.log(`✅ AI Search Test: ${results.searchTest ? 'PASS' : 'FAIL'}`);

  const passCount = Object.values(results).filter(Boolean).length;
  const totalTests = Object.keys(results).length;
  
  console.log(`\n🎯 Overall Result: ${passCount}/${totalTests} tests passed`);
  
  if (passCount === totalTests) {
    console.log('🎉 ALL TESTS PASSED! Enhanced workflow is working correctly.');
  } else {
    console.log('⚠️ Some tests failed. Check the logs above for details.');
  }

  return results;
}

// Run the test
runEnhancedWorkflowTest()
  .then(() => {
    console.log('\n✅ Enhanced workflow test completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Enhanced workflow test failed:', error);
    process.exit(1);
  });

export { runEnhancedWorkflowTest };