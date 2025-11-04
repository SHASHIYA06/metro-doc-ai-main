#!/usr/bin/env node

/**
 * Test Search Without System Filters
 * This tests if removing system/subsystem filters fixes the search
 */

const API_BASE_URL = process.env.VITE_API_BASE_URL || 'https://metro-doc-ai-main.onrender.com';

console.log('🔍 TESTING SEARCH WITHOUT FILTERS');
console.log('=================================\n');

async function testSearchWithoutFilters() {
  try {
    // Step 1: Upload a test document
    console.log('📤 Step 1: Uploading test document...');
    
    const testContent = `KMRCL Metro Railway Test Document

Operating Voltage: 25kV AC, 50Hz
Traction Power: 1500V DC
Control Voltage: 110V DC

Safety Systems:
- Automatic Train Protection (ATP)
- Emergency brake system
- Speed supervision

Rolling Stock:
- 6-car EMU
- Maximum Speed: 80 km/h
- Passenger Capacity: 1,200 passengers

This document is for testing AI search functionality.`;

    const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
    let body = '';
    body += `--${boundary}\r\n`;
    body += `Content-Disposition: form-data; name="files"; filename="test-search.txt"\r\n`;
    body += `Content-Type: text/plain\r\n\r\n`;
    body += testContent;
    body += `\r\n--${boundary}\r\n`;
    body += `Content-Disposition: form-data; name="system"\r\n\r\n`;
    body += 'Test System';
    body += `\r\n--${boundary}\r\n`;
    body += `Content-Disposition: form-data; name="subsystem"\r\n\r\n`;
    body += 'Search Test';
    body += `\r\n--${boundary}--\r\n`;
    
    const uploadResponse = await fetch(`${API_BASE_URL}/ingest`, {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`
      },
      body: body
    });
    
    const uploadResult = await uploadResponse.json();
    console.log('✅ Upload result:', uploadResult);
    
    // Wait for indexing
    console.log('⏳ Waiting 5 seconds for indexing...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Step 2: Check backend stats
    console.log('\n📊 Step 2: Checking backend stats...');
    const statsResponse = await fetch(`${API_BASE_URL}/stats`);
    const stats = await statsResponse.json();
    console.log('Backend stats:', stats);
    console.log('Available systems:', Object.keys(stats.bySystem || {}));
    console.log('Available subsystems:', Object.keys(stats.bySubsystem || {}));
    
    // Step 3: Test search WITH system filter (current broken approach)
    console.log('\n🔍 Step 3: Testing search WITH system filter...');
    const searchWithFilter = await fetch(`${API_BASE_URL}/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'What is the operating voltage?',
        k: 5,
        system: 'Google Drive Analysis', // Wrong system name
        subsystem: 'AI Search Ready',
        tags: []
      })
    });
    
    const resultWithFilter = await searchWithFilter.json();
    console.log('Search WITH filter result:');
    console.log('- Has result:', !!resultWithFilter.result);
    console.log('- Result length:', resultWithFilter.result?.length || 0);
    console.log('- Sources found:', resultWithFilter.sources?.length || 0);
    console.log('- Used chunks:', resultWithFilter.used || 0);
    
    // Step 4: Test search WITHOUT system filter (fixed approach)
    console.log('\n🔍 Step 4: Testing search WITHOUT system filter...');
    const searchWithoutFilter = await fetch(`${API_BASE_URL}/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'What is the operating voltage?',
        k: 5,
        system: '', // Empty = search all systems
        subsystem: '', // Empty = search all subsystems
        tags: []
      })
    });
    
    const resultWithoutFilter = await searchWithoutFilter.json();
    console.log('Search WITHOUT filter result:');
    console.log('- Has result:', !!resultWithoutFilter.result);
    console.log('- Result length:', resultWithoutFilter.result?.length || 0);
    console.log('- Sources found:', resultWithoutFilter.sources?.length || 0);
    console.log('- Used chunks:', resultWithoutFilter.used || 0);
    
    if (resultWithoutFilter.result) {
      console.log('- Answer preview:', resultWithoutFilter.result.substring(0, 200) + '...');
    }
    
    // Step 5: Comparison
    console.log('\n📊 COMPARISON:');
    console.log('================');
    
    if (resultWithFilter.result && resultWithoutFilter.result) {
      console.log('✅ BOTH searches work - system filter is not the issue');
    } else if (!resultWithFilter.result && resultWithoutFilter.result) {
      console.log('🎉 FOUND THE ISSUE! System filter is blocking results');
      console.log('💡 FIX: Remove system/subsystem filters from search');
    } else if (!resultWithFilter.result && !resultWithoutFilter.result) {
      console.log('❌ BOTH searches fail - different issue (indexing problem?)');
    } else {
      console.log('🤔 Unexpected result pattern');
    }
    
    console.log('\n🎯 RECOMMENDATION:');
    if (!resultWithFilter.result && resultWithoutFilter.result) {
      console.log('✅ Use empty system/subsystem filters in frontend search');
      console.log('✅ This will search ALL documents regardless of system name');
    } else if (resultWithoutFilter.result) {
      console.log('✅ Search is working - check frontend implementation');
    } else {
      console.log('❌ Search not working - check backend or indexing');
    }
    
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
  }
}

testSearchWithoutFilters();