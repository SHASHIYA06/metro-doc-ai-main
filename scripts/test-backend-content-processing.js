#!/usr/bin/env node
/**
 * TEST BACKEND CONTENT PROCESSING
 * Debug what's happening with content processing
 */

const API_BASE_URL = process.env.VITE_API_BASE_URL || 'https://metro-doc-ai-main.onrender.com';

console.log('🔍 TESTING BACKEND CONTENT PROCESSING');
console.log('=====================================\n');

async function testBackendProcessing() {
  try {
    // Step 1: Clear backend
    console.log('🧹 Step 1: Clearing backend...');
    try {
      const clearResponse = await fetch(`${API_BASE_URL}/clear`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (clearResponse.ok) {
        console.log('✅ Backend cleared');
      }
    } catch (e) {
      console.log('⚠️ Clear failed, continuing...');
    }

    // Step 2: Upload simple text content as text/plain
    console.log('\n📤 Step 2: Uploading as text/plain...');
    
    const textContent = `B8 Service Checklist - Door Systems Manual

DOOR DETAILS:
1. Door Type: Sliding plug doors
2. Door Width: 1.3 meters per door leaf  
3. Door Height: 1.9 meters
4. Opening Time: 3-5 seconds
5. Closing Time: 3-5 seconds

DCU FAILURE TROUBLESHOOTING:
- Check DCU power supply (110V DC)
- Verify CAN bus communication
- Test door sensors
- Review error logs
- Perform system reset

DOOR TROUBLESHOOTING:
- Door won't open: Check power, sensors, DCU
- Door won't close: Check obstacles, alignment
- Emergency release: Test manual mechanism

This is a comprehensive door systems manual for B8 service maintenance.`;

    const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
    let body = '';
    body += `--${boundary}\r\n`;
    body += `Content-Disposition: form-data; name="files"; filename="B8-Door-Manual.txt"\r\n`;
    body += `Content-Type: text/plain\r\n\r\n`;
    body += textContent;
    body += `\r\n--${boundary}\r\n`;
    body += `Content-Disposition: form-data; name="system"\r\n\r\n`;
    body += 'Google Drive - B8-Door-Manual';
    body += `\r\n--${boundary}\r\n`;
    body += `Content-Disposition: form-data; name="subsystem"\r\n\r\n`;
    body += 'User Upload';
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

    // Step 3: Wait and check stats
    console.log('\n⏳ Step 3: Waiting for processing (8 seconds)...');
    await new Promise(resolve => setTimeout(resolve, 8000));

    const statsResponse = await fetch(`${API_BASE_URL}/stats`);
    const stats = await statsResponse.json();
    console.log('Backend stats:', stats);

    // Step 4: Test searches
    console.log('\n🔍 Step 4: Testing searches...');
    
    const queries = ['door details', 'DCU failure', 'door troubleshooting'];
    
    for (const query of queries) {
      console.log(`\nTesting: "${query}"`);
      try {
        const searchResponse = await fetch(`${API_BASE_URL}/ask`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: query,
            k: 5,
            system: '',
            subsystem: '',
            tags: []
          })
        });

        const searchResult = await searchResponse.json();
        const isSuccess = searchResult.result && 
                         !searchResult.result.includes('No relevant documents found') && 
                         searchResult.sources?.length > 0;

        console.log(`  ${isSuccess ? '✅' : '❌'} ${searchResult.result?.length || 0} chars, ${searchResult.sources?.length || 0} sources`);

        if (isSuccess) {
          // Check if it contains actual door information
          const hasRealContent = searchResult.result.includes('1.3 meters') || 
                                searchResult.result.includes('110V DC') ||
                                searchResult.result.includes('sliding plug doors') ||
                                searchResult.result.includes('CAN bus');
          
          if (hasRealContent) {
            console.log('  ✅ CONTAINS REAL DOOR CONTENT!');
          } else {
            console.log('  ⚠️ Generic response, not real content');
          }

          // Show preview
          const preview = searchResult.result.replace(/<[^>]*>/g, '').substring(0, 200);
          console.log(`  Preview: ${preview}...`);
        }
      } catch (error) {
        console.log(`  ❌ Search error: ${error.message}`);
      }
    }

    console.log('\n🎯 SUMMARY');
    console.log('===========');
    if (stats.totalChunks > 0) {
      console.log('✅ Content was successfully processed and indexed');
      console.log('✅ Backend can handle text content properly');
      console.log('💡 The issue might be with PDF mime type handling');
    } else {
      console.log('❌ Content was not processed or indexed');
      console.log('💡 Backend has issues with content processing');
    }

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
  }
}

testBackendProcessing();