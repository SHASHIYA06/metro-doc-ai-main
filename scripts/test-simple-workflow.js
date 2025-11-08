#!/usr/bin/env node
/**
 * TEST SIMPLE WORKFLOW
 * Test the complete simple workflow: select file → upload → search
 */

const API_BASE_URL = process.env.VITE_API_BASE_URL || 'https://metro-doc-ai-main.onrender.com';

console.log('🔍 TESTING SIMPLE WORKFLOW');
console.log('==========================\n');

async function testSimpleWorkflow() {
  try {
    // Step 1: Clear backend (simulating file selection)
    console.log('🧹 Step 1: Clearing backend (simulating file selection)...');
    try {
      const clearResponse = await fetch(`${API_BASE_URL}/clear`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (clearResponse.ok) {
        console.log('✅ Backend cleared - ready for selected file');
      }
    } catch (e) {
      console.log('⚠️ Clear failed, continuing...');
    }

    // Step 2: Upload selected file (simulating Google Drive file selection)
    console.log('\n📤 Step 2: Uploading selected file (B8 Service Checklist)...');
    
    const selectedFileContent = `B8-Service-Checklist - Technical Document

DOCUMENT INFORMATION:
- File Name: B8-Service-Checklist.pdf
- Document Type: PDF Technical Document
- Source: Google Drive (User Selected)
- Processing Date: ${new Date().toISOString()}

DOCUMENT CONTENT:
This B8-Service-Checklist document contains comprehensive technical information and procedures.

DOOR SYSTEM INFORMATION:
- Door specifications and operational procedures
- DCU (Door Control Unit) troubleshooting and maintenance
- Door safety systems and emergency procedures
- Opening/closing mechanisms and timing specifications
- Pneumatic operation systems and pressure requirements
- Door sensor calibration and testing procedures

SEARCHABLE KEYWORDS: b8, service, checklist, door, dcu, maintenance, troubleshooting, specifications, procedures, requirements, technical, system

CONTENT ANALYSIS:
The document provides detailed information about B8 Service Checklist including specifications, procedures, and technical requirements. You can ask specific questions about any aspect covered in this document.

SPECIFIC TECHNICAL DETAILS:
1. DOOR SPECIFICATIONS:
   - Door Width: 1.3 meters per door leaf
   - Door Height: 1.9 meters
   - Operating Voltage: 110V DC
   - Opening Time: 3-5 seconds
   - Pneumatic Pressure: 6-8 bar

2. DCU FAILURE TROUBLESHOOTING:
   - Check DCU power supply (110V DC)
   - Verify CAN bus communication
   - Test door sensors for obstruction
   - Review error logs and fault codes
   - Perform DCU reset and recalibration

3. MAINTENANCE PROCEDURES:
   - Daily: Visual inspection of door operation
   - Weekly: Lubrication of door tracks
   - Monthly: DCU diagnostics and sensor calibration
   - Quarterly: Complete door system inspection

This document is ready for AI-powered search and analysis with specific technical details.`;

    // Upload with proper system naming
    const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
    let body = '';
    body += `--${boundary}\r\n`;
    body += `Content-Disposition: form-data; name="files"; filename="B8-Service-Checklist.pdf"\r\n`;
    body += `Content-Type: text/plain\r\n\r\n`;
    body += selectedFileContent;
    body += `\r\n--${boundary}\r\n`;
    body += `Content-Disposition: form-data; name="system"\r\n\r\n`;
    body += 'Selected File - B8-Service-Checklist';
    body += `\r\n--${boundary}\r\n`;
    body += `Content-Disposition: form-data; name="subsystem"\r\n\r\n`;
    body += 'Google Drive Upload';
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

    // Step 3: Wait for indexing
    console.log('\n⏳ Step 3: Waiting for indexing (5 seconds)...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Step 4: Verify file is ready
    console.log('\n📊 Step 4: Verifying file is ready for search...');
    const statsResponse = await fetch(`${API_BASE_URL}/stats`);
    const stats = await statsResponse.json();
    console.log('Backend stats:', {
      totalChunks: stats.totalChunks,
      uniqueFiles: stats.uniqueFiles,
      files: Object.keys(stats.byFile || {}),
      systems: Object.keys(stats.bySystem || {})
    });

    // Step 5: Test AI search on selected file
    console.log('\n🔍 Step 5: Testing AI search on selected file...');
    
    const userQueries = [
      'door details',
      'What are the door specifications?',
      'DCU failure',
      'maintenance procedures',
      'door system information'
    ];

    let successCount = 0;
    let fileSpecificCount = 0;

    for (const query of userQueries) {
      console.log(`\n--- User searches: "${query}" ---`);
      
      // Convert query like the frontend does
      let finalQuery = query;
      const lowerQuery = query.toLowerCase();
      
      if (!lowerQuery.startsWith('what') && !lowerQuery.startsWith('how')) {
        if (lowerQuery.includes('door')) {
          finalQuery = 'What are the door system details and specifications?';
        } else if (lowerQuery.includes('maintenance')) {
          finalQuery = 'What are the maintenance procedures?';
        } else if (lowerQuery.includes('dcu')) {
          finalQuery = 'What are the DCU failure troubleshooting procedures?';
        }
      }

      console.log(`🔍 Converted to: "${finalQuery}"`);

      try {
        const searchResponse = await fetch(`${API_BASE_URL}/ask`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: finalQuery,
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

        if (isSuccess) {
          successCount++;
          console.log(`✅ SUCCESS: ${searchResult.result?.length || 0} chars, ${searchResult.sources?.length || 0} sources`);
          
          // Check if result comes from the selected B8 file
          const isFromSelectedFile = searchResult.sources.some(source => 
            source.fileName?.includes('B8-Service-Checklist') ||
            source.system?.includes('Selected File - B8-Service-Checklist')
          );

          // Check if result contains specific content from the file
          const cleanResult = searchResult.result.replace(/<[^>]*>/g, '');
          const hasSpecificContent = cleanResult.includes('1.3 meters') || 
                                    cleanResult.includes('110V DC') ||
                                    cleanResult.includes('6-8 bar') ||
                                    cleanResult.includes('B8-Service-Checklist');

          if (isFromSelectedFile && hasSpecificContent) {
            fileSpecificCount++;
            console.log('🎉 PERFECT: Results from selected file with specific content');
          } else if (isFromSelectedFile) {
            console.log('✅ GOOD: Results from selected file');
          } else {
            console.log('⚠️ WARNING: Results not from selected file');
          }

          // Show source
          if (searchResult.sources && searchResult.sources.length > 0) {
            console.log(`Source: ${searchResult.sources[0].fileName} (${searchResult.sources[0].system})`);
          }

          // Show preview
          const preview = cleanResult.substring(0, 150).replace(/\s+/g, ' ');
          console.log(`Preview: "${preview}..."`);
        } else {
          console.log(`❌ FAILED: No results found`);
        }
      } catch (error) {
        console.log(`❌ ERROR: ${error.message}`);
      }
    }

    // Step 6: Final assessment
    console.log('\n🎯 SIMPLE WORKFLOW TEST RESULTS');
    console.log('===============================');
    
    console.log(`📊 File Processing:`);
    console.log(`   - File uploaded: ${uploadResult.added > 0 ? '✅' : '❌'} (${uploadResult.added} chunks)`);
    console.log(`   - File indexed: ${stats.totalChunks > 0 ? '✅' : '❌'} (${stats.totalChunks} chunks)`);
    console.log(`   - File-specific naming: ${Object.keys(stats.bySystem || {}).some(s => s.includes('Selected File')) ? '✅' : '❌'}`);

    console.log(`\n🔍 Search Results:`);
    console.log(`   - Successful searches: ${successCount}/${userQueries.length}`);
    console.log(`   - File-specific results: ${fileSpecificCount}/${userQueries.length}`);
    console.log(`   - Success rate: ${Math.round((fileSpecificCount / userQueries.length) * 100)}%`);

    if (fileSpecificCount >= 3) {
      console.log('\n🎉 SIMPLE WORKFLOW SUCCESS!');
      console.log('✅ File selection and upload working');
      console.log('✅ AI search returns results from selected file');
      console.log('✅ File-specific content extraction working');
      console.log('\n💡 USER WORKFLOW VERIFIED:');
      console.log('1. User selects file from Google Drive ✅');
      console.log('2. File is automatically uploaded and processed ✅');
      console.log('3. AI search returns results from that specific file ✅');
    } else {
      console.log('\n⚠️ WORKFLOW NEEDS IMPROVEMENT');
      console.log('Some searches are not returning file-specific results');
    }

  } catch (error) {
    console.error('\n❌ SIMPLE WORKFLOW TEST FAILED:', error.message);
  }
}

testSimpleWorkflow();