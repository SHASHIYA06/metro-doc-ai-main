#!/usr/bin/env node
/**
 * TEST FRONTEND FIX
 * Test uploading content as text/plain instead of application/pdf
 */

const API_BASE_URL = process.env.VITE_API_BASE_URL || 'https://metro-doc-ai-main.onrender.com';

console.log('🔍 TESTING FRONTEND FIX');
console.log('========================\n');

async function testFrontendFix() {
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

    // Test with content that matches frontend-generated patterns
    console.log('\n📤 Testing with frontend-generated content as text/plain...');
    
    const frontendContent = `B8-Service-Checklist - PDF Document Content
DOCUMENT INFORMATION:
- File Name: B8-Service-Checklist.pdf
- Document Type: PDF
- Source: Google Drive

SEARCHABLE CONTENT:
B8 Service Checklist procedures, specifications, guidelines, and technical information.

KEYWORDS: b8, service, checklist, door, systems, DCU, failure

DOOR SYSTEMS INFORMATION:
1. DOOR SPECIFICATIONS:
   - Door width: 1.3 meters per door leaf
   - Door height: 1.9 meters
   - Opening time: 3-5 seconds
   - Operating voltage: 110V DC

2. DCU FAILURE TROUBLESHOOTING:
   - Check DCU power supply (110V DC)
   - Verify CAN bus communication
   - Test door sensors for obstruction
   - Review error logs and fault codes
   - Perform DCU reset and recalibration

3. DOOR TROUBLESHOOTING PROCEDURES:
   - Door won't open: Check power supply, sensor status, DCU communication
   - Door won't close: Check for obstacles, sensor alignment, mechanical issues
   - Emergency release: Test manual mechanism operation

SUGGESTED QUERIES:
- "What are the B8-Service-Checklist procedures?"
- "Describe the door systems"
- "DCU failure troubleshooting"
- "Door specifications"

This document contains comprehensive door system information for B8 service maintenance.`;

    console.log('Content details:');
    console.log(`Length: ${frontendContent.length} characters`);
    console.log(`Contains "DOCUMENT INFORMATION:": ${frontendContent.includes('DOCUMENT INFORMATION:')}`);
    console.log(`Contains "SEARCHABLE CONTENT:": ${frontendContent.includes('SEARCHABLE CONTENT:')}`);
    console.log(`Contains "KEYWORDS:": ${frontendContent.includes('KEYWORDS:')}`);
    console.log(`Contains "SUGGESTED QUERIES:": ${frontendContent.includes('SUGGESTED QUERIES:')}`);

    // Upload as text/plain (like the frontend fix does)
    const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
    let body = '';
    body += `--${boundary}\r\n`;
    body += `Content-Disposition: form-data; name="files"; filename="B8-Service-Checklist.pdf"\r\n`;
    body += `Content-Type: text/plain\r\n\r\n`;  // ← This is the key fix!
    body += frontendContent;
    body += `\r\n--${boundary}\r\n`;
    body += `Content-Disposition: form-data; name="system"\r\n\r\n`;
    body += 'Google Drive - B8-Service-Checklist';
    body += `\r\n--${boundary}\r\n`;
    body += `Content-Disposition: form-data; name="subsystem"\r\n\r\n`;
    body += 'User Upload';
    body += `\r\n--${boundary}--\r\n`;

    console.log('\n📤 Uploading as text/plain...');
    const uploadResponse = await fetch(`${API_BASE_URL}/ingest`, {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`
      },
      body: body
    });

    const uploadResult = await uploadResponse.json();
    console.log('Upload result:', uploadResult);

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
        query: 'door details',
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
      console.log('\nSource analysis:');
      const source = searchResult.sources[0];
      console.log(`File: ${source.fileName}`);
      console.log(`System: ${source.system}`);
      console.log(`Preview length: ${source.preview?.length || 0} chars`);
      console.log(`Preview: "${source.preview?.substring(0, 200)}..."`);
      
      const hasRealContent = source.preview && (
        source.preview.includes('1.3 meters') ||
        source.preview.includes('110V DC') ||
        source.preview.includes('DCU power supply') ||
        source.preview.includes('Door width')
      );
      console.log(`Contains real door content: ${hasRealContent ? '✅ YES' : '❌ NO'}`);
    }

    // Check AI response
    if (searchResult.result) {
      const cleanResult = searchResult.result.replace(/<[^>]*>/g, '');
      const mentionsError = cleanResult.includes('Invalid PDF structure') || 
                           cleanResult.includes('error extracting content') ||
                           cleanResult.includes('unable to provide specific');
      
      const containsRealInfo = cleanResult.includes('1.3 meters') || 
                              cleanResult.includes('110V DC') ||
                              cleanResult.includes('DCU power supply');
      
      console.log(`\nAI Response analysis:`);
      console.log(`Mentions extraction error: ${mentionsError ? '❌ YES' : '✅ NO'}`);
      console.log(`Contains real door info: ${containsRealInfo ? '✅ YES' : '❌ NO'}`);
    }

    // Final analysis
    console.log('\n🎯 ANALYSIS');
    console.log('===========');
    
    if (stats.averageChunkSize > 400) {
      console.log('✅ SUCCESS! Content processed correctly as text');
      console.log('✅ Chunk size is reasonable - content not truncated');
      
      if (searchResult.sources && searchResult.sources.length > 0) {
        const hasRealContent = searchResult.sources[0].preview && 
                              searchResult.sources[0].preview.includes('1.3 meters');
        if (hasRealContent) {
          console.log('✅ Real content found in search results');
          console.log('🎉 FRONTEND FIX WORKS! Upload as text/plain solves the issue');
        } else {
          console.log('⚠️ Content processed but not found in search');
        }
      }
    } else {
      console.log('❌ Still failing - chunk size too small');
      console.log('💡 Backend might still have issues processing the content');
    }

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
  }
}

testFrontendFix();