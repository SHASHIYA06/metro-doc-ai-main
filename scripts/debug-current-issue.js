#!/usr/bin/env node

/**
 * DEBUG CURRENT ISSUE
 * Test the exact workflow the user is experiencing
 */

const API_BASE_URL = process.env.VITE_API_BASE_URL || 'https://metro-doc-ai-main.onrender.com';

console.log('🔍 DEBUGGING CURRENT ISSUE');
console.log('==========================\n');

async function debugCurrentIssue() {
  try {
    // Step 1: Check current backend state
    console.log('📊 Step 1: Checking current backend state...');
    
    const statsResponse = await fetch(`${API_BASE_URL}/stats`);
    const stats = await statsResponse.json();
    console.log('Current backend stats:', stats);
    console.log('- Total chunks:', stats.totalChunks);
    console.log('- Total files:', stats.uniqueFiles);
    console.log('- Available systems:', Object.keys(stats.bySystem || {}));
    console.log('- Available subsystems:', Object.keys(stats.bySubsystem || {}));
    
    if (stats.totalChunks === 0) {
      console.log('\n❌ PROBLEM FOUND: No documents indexed!');
      console.log('The backend has no documents, so search will always fail.');
      console.log('Need to upload documents first.');
      return;
    }
    
    // Step 2: Upload a fresh test document
    console.log('\n📤 Step 2: Uploading fresh test document...');
    
    const testContent = `KMRCL Metro Railway System - Test Document for AI Search

ELECTRICAL SPECIFICATIONS:
- Operating Voltage: 25kV AC, 50Hz overhead catenary system
- Traction Power: 1500V DC third rail system
- Control Voltage: 110V DC with battery backup
- Emergency Power: Diesel generator sets

SIGNALING SYSTEM:
- CBTC (Communication Based Train Control)
- Automatic Train Protection (ATP)
- Automatic Train Operation (ATO)
- Platform Screen Doors integration

SAFETY SYSTEMS:
- Emergency brake system with redundancy
- Fire detection and suppression
- Passenger emergency communication
- Speed supervision and enforcement

ROLLING STOCK:
- 6-car Electric Multiple Unit (EMU)
- Maximum Speed: 80 km/h
- Passenger Capacity: 1,200 passengers
- Car Length: 22 meters per car

This document contains technical information for AI search testing.`;

    const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
    let body = '';
    body += `--${boundary}\r\n`;
    body += `Content-Disposition: form-data; name="files"; filename="KMRCL-Debug-Test.txt"\r\n`;
    body += `Content-Type: text/plain\r\n\r\n`;
    body += testContent;
    body += `\r\n--${boundary}\r\n`;
    body += `Content-Disposition: form-data; name="system"\r\n\r\n`;
    body += 'KMRCL Metro';
    body += `\r\n--${boundary}\r\n`;
    body += `Content-Disposition: form-data; name="subsystem"\r\n\r\n`;
    body += 'Debug Test';
    body += `\r\n--${boundary}--\r\n`;
    
    const uploadResponse = await fetch(`${API_BASE_URL}/ingest`, {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`
      },
      body: body
    });
    
    const uploadResult = await uploadResponse.json();
    console.log('Upload result:', uploadResult);
    
    if (!uploadResult.added || uploadResult.added === 0) {
      console.log('❌ UPLOAD FAILED: No chunks added');
      return;
    }
    
    console.log(`✅ Upload successful: ${uploadResult.added} chunks added`);
    
    // Step 3: Wait for indexing
    console.log('\n⏳ Step 3: Waiting for indexing (8 seconds)...');
    await new Promise(resolve => setTimeout(resolve, 8000));
    
    // Step 4: Check updated stats
    console.log('\n📊 Step 4: Checking updated stats...');
    const newStatsResponse = await fetch(`${API_BASE_URL}/stats`);
    const newStats = await newStatsResponse.json();
    console.log('Updated stats:', newStats);
    console.log('- Total chunks:', newStats.totalChunks);
    console.log('- Total files:', newStats.uniqueFiles);
    
    // Step 5: Test the exact search that's failing
    console.log('\n🔍 Step 5: Testing exact search query...');
    
    const testQueries = [
      'What is the operating voltage?',
      'voltage',
      'KMRCL',
      'safety',
      'train'
    ];
    
    for (const query of testQueries) {
      console.log(`\n   Testing: "${query}"`);
      
      const searchResponse = await fetch(`${API_BASE_URL}/ask`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: query,
          k: 10,
          system: '',
          subsystem: '',
          tags: []
        })
      });
      
      if (!searchResponse.ok) {
        console.log(`   ❌ HTTP Error: ${searchResponse.status}`);
        continue;
      }
      
      const searchResult = await searchResponse.json();
      console.log(`   Response:`, {
        hasResult: !!searchResult.result,
        resultLength: searchResult.result?.length || 0,
        resultPreview: searchResult.result?.substring(0, 100) || 'No result',
        sourcesCount: searchResult.sources?.length || 0,
        used: searchResult.used || 0,
        totalIndexed: searchResult.totalIndexed || 0
      });
      
      if (searchResult.result && searchResult.result.includes('No relevant documents found')) {
        console.log('   ⚠️ Backend is returning "No relevant documents found" message');
        console.log('   This means the search algorithm is not finding matches');
      }
    }
    
    // Step 6: Test with different search parameters
    console.log('\n🔧 Step 6: Testing with different parameters...');
    
    const paramTests = [
      { k: 5, system: '', subsystem: '', tags: [] },
      { k: 20, system: '', subsystem: '', tags: [] },
      { k: 5, system: 'KMRCL Metro', subsystem: '', tags: [] },
      { k: 5, system: '', subsystem: 'Debug Test', tags: [] },
      { k: 5, system: 'KMRCL Metro', subsystem: 'Debug Test', tags: [] }
    ];
    
    for (let i = 0; i < paramTests.length; i++) {
      const params = paramTests[i];
      console.log(`\n   Test ${i + 1}: k=${params.k}, system="${params.system}", subsystem="${params.subsystem}"`);
      
      const searchResponse = await fetch(`${API_BASE_URL}/ask`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: 'What is the operating voltage?',
          ...params
        })
      });
      
      const searchResult = await searchResponse.json();
      console.log(`   Result: ${searchResult.result?.length || 0} chars, ${searchResult.sources?.length || 0} sources, ${searchResult.used || 0} used`);
      
      if (searchResult.sources && searchResult.sources.length > 0) {
        console.log('   ✅ FOUND WORKING PARAMETERS!');
        console.log('   Working params:', params);
        break;
      }
    }
    
    console.log('\n🎯 DIAGNOSIS COMPLETE');
    console.log('====================');
    
  } catch (error) {
    console.error('\n❌ DEBUG FAILED:', error.message);
  }
}

debugCurrentIssue();