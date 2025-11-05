#!/usr/bin/env node
/**
 * TEST CONTENT DETECTION
 * Test if the content detection logic is working
 */

const API_BASE_URL = process.env.VITE_API_BASE_URL || 'https://metro-doc-ai-main.onrender.com';

console.log('🔍 TESTING CONTENT DETECTION');
console.log('=============================\n');

async function testContentDetection() {
  try {
    // Clear backend first
    console.log('🧹 Clearing backend...');
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

    // Test with content that should trigger text detection
    console.log('\n📤 Testing with content that should trigger text detection...');
    
    const testContent = `DOCUMENT INFORMATION:
- File Name: B8-Service-Checklist.pdf
- Document Type: PDF
- Source: Google Drive

DOOR SYSTEMS INFORMATION:
This document contains door system specifications and procedures.

Door width: 1.3 meters per door leaf
Door height: 1.9 meters  
Operating voltage: 110V DC

DCU FAILURE troubleshooting procedures are included.

KEYWORDS: door, systems, DCU, failure, troubleshooting

This content should be detected as text content from frontend.`;

    console.log('Content to upload:');
    console.log(`Length: ${testContent.length} characters`);
    console.log(`Contains "DOCUMENT INFORMATION:": ${testContent.includes('DOCUMENT INFORMATION:')}`);
    console.log(`Contains "DOOR SYSTEMS": ${testContent.includes('DOOR SYSTEMS')}`);
    console.log(`Contains "DCU FAILURE": ${testContent.includes('DCU FAILURE')}`);
    console.log(`Contains "Door width": ${testContent.includes('Door width')}`);
    console.log(`Contains "110V DC": ${testContent.includes('110V DC')}`);

    const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
    let body = '';
    body += `--${boundary}\r\n`;
    body += `Content-Disposition: form-data; name="files"; filename="B8-Service-Checklist.pdf"\r\n`;
    body += `Content-Type: application/pdf\r\n\r\n`;
    body += testContent;
    body += `\r\n--${boundary}\r\n`;
    body += `Content-Disposition: form-data; name="system"\r\n\r\n`;
    body += 'Google Drive - B8-Service-Checklist';
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
    console.log('\nUpload result:', uploadResult);

    // Wait and check stats
    console.log('\n⏳ Waiting for processing (5 seconds)...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    const statsResponse = await fetch(`${API_BASE_URL}/stats`);
    const stats = await statsResponse.json();
    console.log('\nBackend stats:', stats);
    console.log(`Average chunk size: ${stats.averageChunkSize} characters`);

    // Test search
    console.log('\n🔍 Testing search...');
    const searchResponse = await fetch(`${API_BASE_URL}/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'door width',
        k: 5,
        system: '',
        subsystem: '',
        tags: []
      })
    });

    const searchResult = await searchResponse.json();
    console.log(`Search result: ${searchResult.result?.length || 0} chars`);
    console.log(`Sources: ${searchResult.sources?.length || 0}`);

    if (searchResult.sources && searchResult.sources.length > 0) {
      console.log('\nSource preview:');
      console.log(`"${searchResult.sources[0].preview}"`);
      
      const hasRealContent = searchResult.sources[0].preview.includes('1.3 meters') ||
                            searchResult.sources[0].preview.includes('110V DC');
      console.log(`Contains real content: ${hasRealContent ? '✅ YES' : '❌ NO'}`);
    }

    // Analysis
    console.log('\n🎯 ANALYSIS');
    console.log('===========');
    
    if (stats.averageChunkSize > 200) {
      console.log('✅ Content detection worked - chunk size is reasonable');
      console.log('✅ Text content was processed correctly');
    } else if (stats.averageChunkSize < 100) {
      console.log('❌ Content detection failed - chunk size too small');
      console.log('💡 Backend is still trying to parse text as binary PDF');
      console.log('💡 Need to fix the content detection logic');
    } else {
      console.log('⚠️ Partial success - chunk size is small but not error-level');
    }

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
  }
}

testContentDetection();