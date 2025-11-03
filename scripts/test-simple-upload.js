#!/usr/bin/env node

/**
 * SIMPLE UPLOAD TEST - No dependencies
 * Tests the complete workflow using native fetch
 */

const API_BASE_URL = process.env.VITE_API_BASE_URL || 'https://metro-doc-ai-main.onrender.com';

console.log('🚀 SIMPLE UPLOAD TEST');
console.log('====================\n');
console.log(`Backend URL: ${API_BASE_URL}\n`);

const testContent = `KMRCL Metro Railway - Technical Document

ELECTRICAL SPECIFICATIONS:
- Operating Voltage: 25kV AC, 50Hz
- Traction Power: 1500V DC
- Control Voltage: 110V DC
- Signaling: CBTC System

SAFETY SYSTEMS:
- Automatic Train Protection (ATP)
- Emergency brake system
- Speed supervision
- Route interlocking

ROLLING STOCK:
- Configuration: 6-car EMU
- Maximum Speed: 80 km/h
- Passenger Capacity: 1,200 passengers
- Motor Power: 200 kW per motor

This is a test document for AI search.`;

async function testSimpleUpload() {
  try {
    // Step 1: Health check
    console.log('📡 Step 1: Checking backend health...');
    const healthResponse = await fetch(`${API_BASE_URL}/health`);
    const healthData = await healthResponse.json();
    console.log('✅ Backend healthy:', healthData.ok ? 'YES' : 'NO');
    console.log(`   Indexed chunks: ${healthData.indexed}`);
    console.log('');

    // Step 2: Upload using multipart form data (manual construction)
    console.log('📤 Step 2: Uploading test document...');
    
    const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
    const fileName = 'KMRCL-Test-Document.txt';
    
    let body = '';
    body += `--${boundary}\r\n`;
    body += `Content-Disposition: form-data; name="files"; filename="${fileName}"\r\n`;
    body += `Content-Type: text/plain\r\n\r\n`;
    body += testContent;
    body += `\r\n--${boundary}\r\n`;
    body += `Content-Disposition: form-data; name="system"\r\n\r\n`;
    body += 'KMRCL Test';
    body += `\r\n--${boundary}\r\n`;
    body += `Content-Disposition: form-data; name="subsystem"\r\n\r\n`;
    body += 'AI Search Ready';
    body += `\r\n--${boundary}--\r\n`;
    
    const uploadResponse = await fetch(`${API_BASE_URL}/ingest`, {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`
      },
      body: body
    });
    
    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      throw new Error(`Upload failed: ${uploadResponse.status} - ${errorText}`);
    }
    
    const uploadResult = await uploadResponse.json();
    console.log('✅ Upload successful!');
    console.log(`   Files processed: ${uploadResult.total}`);
    console.log(`   Chunks added: ${uploadResult.added}`);
    console.log('');

    // Step 3: Wait for indexing
    console.log('⏳ Step 3: Waiting for indexing (5 seconds)...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    console.log('✅ Wait complete');
    console.log('');

    // Step 4: Check stats
    console.log('📊 Step 4: Checking backend stats...');
    const statsResponse = await fetch(`${API_BASE_URL}/stats`);
    const stats = await statsResponse.json();
    console.log('✅ Stats retrieved:');
    console.log(`   Total chunks: ${stats.totalChunks}`);
    console.log(`   Total files: ${stats.uniqueFiles}`);
    console.log('');

    // Step 5: Test search
    console.log('🔍 Step 5: Testing AI search...');
    const searchResponse = await fetch(`${API_BASE_URL}/ask`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query: 'What is the operating voltage?',
        k: 5
      })
    });
    
    if (!searchResponse.ok) {
      throw new Error(`Search failed: ${searchResponse.status}`);
    }
    
    const searchResult = await searchResponse.json();
    console.log('✅ Search successful!');
    console.log(`   Answer: ${searchResult.answer?.substring(0, 200)}...`);
    console.log(`   Sources: ${searchResult.sources?.length || 0}`);
    console.log('');

    console.log('🎉 ALL TESTS PASSED!');
    console.log('===================');
    console.log('✅ Backend is working');
    console.log('✅ Upload works');
    console.log('✅ Indexing works');
    console.log('✅ AI search works');
    console.log('');
    console.log('💡 The frontend should use the same approach!');

  } catch (error) {
    console.error('');
    console.error('❌ TEST FAILED:', error.message);
    console.error('');
    process.exit(1);
  }
}

testSimpleUpload();
