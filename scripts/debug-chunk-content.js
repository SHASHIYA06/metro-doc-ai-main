#!/usr/bin/env node
/**
 * DEBUG CHUNK CONTENT
 * Check what's actually stored in the vector store chunks
 */

const API_BASE_URL = process.env.VITE_API_BASE_URL || 'https://metro-doc-ai-main.onrender.com';

console.log('🔍 DEBUGGING CHUNK CONTENT');
console.log('===========================\n');

async function debugChunkContent() {
  try {
    // Step 1: Upload content
    console.log('📤 Step 1: Uploading test content...');
    
    const testContent = `B8-Service-Checklist - PDF Document Content
DOCUMENT INFORMATION:
- File Name: B8-Service-Checklist.pdf
- Document Type: PDF
- Source: Google Drive

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
   - Door won't open: Check power, sensors, DCU status
   - Door won't close: Check obstacles, sensor alignment
   - Emergency release: Test manual mechanism operation

This document contains comprehensive door system information for B8 service maintenance.`;

    // Clear backend first
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
    console.log('Upload result:', uploadResult);

    // Step 2: Wait for processing
    console.log('\n⏳ Step 2: Waiting for processing (5 seconds)...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Step 3: Check what's actually in the chunks
    console.log('\n🔍 Step 3: Checking chunk content...');
    const debugResponse = await fetch(`${API_BASE_URL}/debug/chunks`);
    const debugData = await debugResponse.json();
    
    console.log(`📊 Total chunks: ${debugData.totalChunks}`);
    
    debugData.chunks.forEach((chunk, index) => {
      console.log(`\n--- CHUNK ${index + 1} ---`);
      console.log(`File: ${chunk.fileName}`);
      console.log(`System: ${chunk.system}`);
      console.log(`Subsystem: ${chunk.subsystem}`);
      console.log(`Length: ${chunk.chunkLength} characters`);
      console.log(`Tags: ${chunk.tags?.join(', ') || 'none'}`);
      console.log(`Content Preview:`);
      console.log(`"${chunk.chunkPreview}"`);
      
      // Check if the chunk contains the door information we uploaded
      const hasRealContent = chunk.chunkPreview.includes('1.3 meters') || 
                           chunk.chunkPreview.includes('110V DC') ||
                           chunk.chunkPreview.includes('DCU power supply') ||
                           chunk.chunkPreview.includes('Door width');
      
      console.log(`Contains real door content: ${hasRealContent ? '✅ YES' : '❌ NO'}`);
    });

    // Step 4: Test search to see what context is passed to AI
    console.log('\n🔍 Step 4: Testing search to see AI context...');
    
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
    console.log(`Search result length: ${searchResult.result?.length || 0} chars`);
    console.log(`Sources found: ${searchResult.sources?.length || 0}`);
    
    if (searchResult.sources && searchResult.sources.length > 0) {
      console.log('\n--- SEARCH SOURCES ---');
      searchResult.sources.forEach((source, index) => {
        console.log(`Source ${index + 1}:`);
        console.log(`  File: ${source.fileName}`);
        console.log(`  Score: ${source.score}`);
        console.log(`  Preview: "${source.preview}"`);
        
        const hasRealContent = source.preview.includes('1.3 meters') || 
                             source.preview.includes('110V DC') ||
                             source.preview.includes('DCU power supply');
        
        console.log(`  Contains real content: ${hasRealContent ? '✅ YES' : '❌ NO'}`);
      });
    }

    // Step 5: Analysis
    console.log('\n🎯 ANALYSIS');
    console.log('===========');
    
    if (debugData.totalChunks === 0) {
      console.log('❌ No chunks were created - upload/processing failed');
    } else {
      const hasRealContentInChunks = debugData.chunks.some(chunk => 
        chunk.chunkPreview.includes('1.3 meters') || 
        chunk.chunkPreview.includes('110V DC')
      );
      
      if (hasRealContentInChunks) {
        console.log('✅ Real content IS stored in chunks');
        
        if (searchResult.sources && searchResult.sources.length > 0) {
          const hasRealContentInSearch = searchResult.sources.some(source =>
            source.preview.includes('1.3 meters') || 
            source.preview.includes('110V DC')
          );
          
          if (hasRealContentInSearch) {
            console.log('✅ Real content IS passed to AI in search');
            console.log('💡 Issue is in AI response generation - it\'s ignoring the content');
          } else {
            console.log('❌ Real content NOT passed to AI in search');
            console.log('💡 Issue is in search/retrieval process');
          }
        } else {
          console.log('❌ No sources returned in search');
          console.log('💡 Issue is in search similarity matching');
        }
      } else {
        console.log('❌ Real content NOT stored in chunks');
        console.log('💡 Issue is in content processing/chunking');
      }
    }

  } catch (error) {
    console.error('\n❌ DEBUG FAILED:', error.message);
  }
}

debugChunkContent();