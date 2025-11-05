#!/usr/bin/env node
/**
 * TEST WITH REAL CONTENT
 * Upload content that matches what the frontend sends
 */

const API_BASE_URL = process.env.VITE_API_BASE_URL || 'https://metro-doc-ai-main.onrender.com';

console.log('🔍 TESTING WITH REAL FRONTEND CONTENT');
console.log('=====================================\n');

async function testWithRealContent() {
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

    // Step 2: Upload content exactly like the frontend does
    console.log('\n📤 Step 2: Uploading content like frontend...');
    
    // This is the exact content the frontend generates for PDFs
    const frontendContent = `B8-Service-Checklist - PDF Document Content
DOCUMENT INFORMATION:
- File Name: B8-Service-Checklist.pdf
- Document Type: PDF
- File Size: 2048000 bytes
- Source: Google Drive

DOCUMENT CONTENT SUMMARY:
This is a B8-Service-Checklist document that contains detailed information and procedures.

SEARCHABLE CONTENT:
B8 Service Checklist procedures, specifications, guidelines, and technical information.

KEYWORDS: b8, service, checklist

NOTE: This PDF document has been uploaded to the AI system for content analysis. 
The backend will process the actual PDF content for detailed text extraction and indexing.
You can ask questions about B8-Service-Checklist procedures, specifications, or any related topics.

SUGGESTED QUERIES:
- "What are the B8-Service-Checklist procedures?"
- "Describe the B8-Service-Checklist specifications"
- "What information is in the B8-Service-Checklist document?"
- "B8-Service-Checklist details"
- "B8-Service-Checklist requirements"

This document is now available for AI search and analysis.

DOOR SYSTEMS INFORMATION:
The B8 Service Checklist includes comprehensive door system procedures:

1. DOOR OPERATION CHECKS:
   - Door opening mechanism verification
   - Door closing mechanism testing
   - Door sensor calibration
   - Emergency door release testing

2. DCU (DOOR CONTROL UNIT) DIAGNOSTICS:
   - DCU power supply verification (110V DC)
   - CAN bus communication testing
   - Error log analysis
   - System reset procedures

3. DOOR TROUBLESHOOTING:
   - Door won't open: Check power supply, sensor status, DCU communication
   - Door won't close: Check for obstacles, sensor alignment, mechanical issues
   - DCU failure: Verify power supply, check communication cables, reset system
   - Emergency release issues: Check manual mechanism operation

4. DOOR SPECIFICATIONS:
   - Door width: 1.3 meters per door leaf
   - Door height: 1.9 meters
   - Opening time: 3-5 seconds
   - Closing time: 3-5 seconds
   - Operating voltage: 110V DC

This B8 Service Checklist provides complete door system maintenance and troubleshooting information.`;

    const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
    let body = '';
    body += `--${boundary}\r\n`;
    body += `Content-Disposition: form-data; name="files"; filename="B8-Service-Checklist.pdf"\r\n`;
    body += `Content-Type: application/pdf\r\n\r\n`;
    body += frontendContent;
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
    console.log('Upload result:', uploadResult);

    // Step 3: Wait and check stats
    console.log('\n⏳ Step 3: Waiting for processing (8 seconds)...');
    await new Promise(resolve => setTimeout(resolve, 8000));

    const statsResponse = await fetch(`${API_BASE_URL}/stats`);
    const stats = await statsResponse.json();
    console.log('Backend stats:', stats);

    // Step 4: Test the exact searches that are failing
    console.log('\n🔍 Step 4: Testing exact searches...');
    
    const queries = [
      'door details',
      'What are the door systems?',
      'DCU failure',
      'door troubleshooting',
      'B8 Service Checklist procedures'
    ];
    
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
          // Check if it contains the actual uploaded content
          const hasRealContent = searchResult.result.includes('1.3 meters') || 
                                searchResult.result.includes('110V DC') ||
                                searchResult.result.includes('B8-Service-Checklist') ||
                                searchResult.result.includes('DCU power supply') ||
                                searchResult.result.includes('Door opening mechanism');
          
          if (hasRealContent) {
            console.log('  ✅ CONTAINS ACTUAL UPLOADED CONTENT!');
          } else {
            console.log('  ⚠️ Generic response, not using uploaded content');
          }

          // Show preview
          const preview = searchResult.result.replace(/<[^>]*>/g, '').substring(0, 300);
          console.log(`  Preview: ${preview}...`);
        }
      } catch (error) {
        console.log(`  ❌ Search error: ${error.message}`);
      }
    }

    console.log('\n🎯 DIAGNOSIS');
    console.log('=============');
    if (stats.totalChunks > 0) {
      console.log('✅ Content was indexed in backend');
      console.log(`📊 Chunks: ${stats.totalChunks}, Files: ${stats.uniqueFiles}`);
      console.log(`📁 Files: ${Object.keys(stats.byFile || {}).join(', ')}`);
      console.log(`🏷️ Systems: ${Object.keys(stats.bySystem || {}).join(', ')}`);
      
      // Check if searches are working with real content
      console.log('\n💡 If searches return generic responses instead of uploaded content,');
      console.log('   the issue is in the AI generation, not the indexing.');
    } else {
      console.log('❌ Content was not indexed - backend processing issue');
    }

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
  }
}

testWithRealContent();