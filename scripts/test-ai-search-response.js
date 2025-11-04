#!/usr/bin/env node

/**
 * Test AI Search Response Format
 * This script tests what the backend actually returns
 */

const API_BASE_URL = process.env.VITE_API_BASE_URL || 'https://metro-doc-ai-main.onrender.com';

console.log('🔍 TESTING AI SEARCH RESPONSE FORMAT');
console.log('====================================\n');

async function testAISearchResponse() {
  try {
    // Step 1: Upload a test document
    console.log('📤 Step 1: Uploading test document...');
    
    const testContent = `KMRCL Metro Railway System

Operating Voltage: 25kV AC, 50Hz
Traction Power: 1500V DC
Control Voltage: 110V DC

Safety Systems:
- Automatic Train Protection (ATP)
- Emergency brake system

Rolling Stock:
- 6-car EMU
- Maximum Speed: 80 km/h`;

    const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
    let body = '';
    body += `--${boundary}\r\n`;
    body += `Content-Disposition: form-data; name="files"; filename="test.txt"\r\n`;
    body += `Content-Type: text/plain\r\n\r\n`;
    body += testContent;
    body += `\r\n--${boundary}\r\n`;
    body += `Content-Disposition: form-data; name="system"\r\n\r\n`;
    body += 'Test';
    body += `\r\n--${boundary}\r\n`;
    body += `Content-Disposition: form-data; name="subsystem"\r\n\r\n`;
    body += 'AI Search';
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
    
    // Step 2: Test AI search
    console.log('\n🔍 Step 2: Testing AI search...');
    console.log('Query: "What is the operating voltage?"');
    
    const searchResponse = await fetch(`${API_BASE_URL}/ask`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query: 'What is the operating voltage?',
        k: 5,
        system: '',
        subsystem: '',
        tags: []
      })
    });
    
    if (!searchResponse.ok) {
      throw new Error(`Search failed: ${searchResponse.status}`);
    }
    
    const searchResult = await searchResponse.json();
    
    console.log('\n📊 SEARCH RESPONSE STRUCTURE:');
    console.log('================================');
    console.log(JSON.stringify(searchResult, null, 2));
    console.log('================================\n');
    
    console.log('🔍 RESPONSE FIELDS:');
    console.log('- Has "answer" field:', 'answer' in searchResult);
    console.log('- Has "result" field:', 'result' in searchResult);
    console.log('- Has "sources" field:', 'sources' in searchResult);
    console.log('- Has "used" field:', 'used' in searchResult);
    console.log('');
    
    if ('answer' in searchResult) {
      console.log('✅ Backend returns "answer" field');
      console.log('Answer:', searchResult.answer);
    }
    
    if ('result' in searchResult) {
      console.log('✅ Backend returns "result" field');
      console.log('Result:', searchResult.result);
    }
    
    if ('sources' in searchResult) {
      console.log('✅ Backend returns "sources" field');
      console.log('Sources count:', searchResult.sources?.length || 0);
    }
    
    console.log('\n💡 RECOMMENDATION:');
    if ('answer' in searchResult && !('result' in searchResult)) {
      console.log('⚠️  Backend uses "answer" but frontend expects "result"');
      console.log('🔧 Need to update frontend to use "answer" instead of "result"');
    } else if ('result' in searchResult) {
      console.log('✅ Backend uses "result" - frontend is correct');
    }
    
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
  }
}

testAISearchResponse();
