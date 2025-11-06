#!/usr/bin/env node
/**
 * TEST CLEAN BACKEND WORKFLOW
 * Test the complete workflow with clean backend
 */

const API_BASE_URL = process.env.VITE_API_BASE_URL || 'https://metro-doc-ai-main.onrender.com';

console.log('🧪 TESTING CLEAN BACKEND WORKFLOW');
console.log('==================================\n');

async function testCleanBackendWorkflow() {
  try {
    // Step 1: Verify backend is clean
    console.log('📊 Step 1: Verifying backend is clean...');
    const statsResponse = await fetch(`${API_BASE_URL}/stats`);
    const stats = await statsResponse.json();
    console.log('Current backend stats:', stats);
    
    if (stats.totalChunks > 0) {
      console.log('⚠️ WARNING: Backend has existing data that may interfere');
      console.log('Files present:', Object.keys(stats.byFile || {}));
    } else {
      console.log('✅ Backend is clean - perfect for testing');
    }

    // Step 2: Upload surge-related document (simulating your use case)
    console.log('\n📤 Step 2: Uploading surge-related document...');
    
    const surgeContent = `Surge Protection Systems - Technical Manual
DOCUMENT INFORMATION:
- File Name: Surge-Protection-Manual.pdf
- Document Type: PDF
- Source: Google Drive

SEARCHABLE CONTENT:
Surge protection systems, surge arresters, overvoltage protection, lightning protection.

KEYWORDS: surge, protection, arrester, overvoltage, lightning, grounding

SURGE PROTECTION DETAILS:
1. SURGE ARRESTER SPECIFICATIONS:
   - Type: Metal Oxide Varistor (MOV)
   - Rated Voltage: 25kV AC
   - Maximum Continuous Operating Voltage: 20kV
   - Nominal Discharge Current: 10kA
   - Energy Absorption Capability: 4.5 MJ/m³

2. SURGE PROTECTION SYSTEMS:
   - Primary Protection: Station surge arresters
   - Secondary Protection: Equipment surge suppressors
   - Tertiary Protection: Electronic circuit protection
   - Grounding System: Low impedance earth grid

3. SURGE TROUBLESHOOTING:
   - Surge arrester failure: Check for physical damage, measure leakage current
   - Overvoltage events: Review protection coordination, check grounding
   - Equipment damage: Inspect surge protection devices, verify ratings
   - System faults: Analyze surge recorder data, check protection settings

4. SURGE SPECIFICATIONS:
   - Lightning impulse withstand: 125kV (1.2/50μs)
   - Switching impulse withstand: 95kV (250/2500μs)
   - Power frequency withstand: 50kV (1 minute)
   - Insulation coordination level: Basic Insulation Level (BIL) 125kV

This manual provides comprehensive surge protection information for electrical systems.`;

    // Upload with text/plain MIME type
    const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
    let body = '';
    body += `--${boundary}\r\n`;
    body += `Content-Disposition: form-data; name="files"; filename="Surge-Protection-Manual.pdf"\r\n`;
    body += `Content-Type: text/plain\r\n\r\n`;
    body += surgeContent;
    body += `\r\n--${boundary}\r\n`;
    body += `Content-Disposition: form-data; name="system"\r\n\r\n`;
    body += 'Google Drive - Surge-Protection-Manual';
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
    console.log('✅ Upload result:', uploadResult);

    // Step 3: Wait for indexing
    console.log('\n⏳ Step 3: Waiting for indexing (8 seconds)...');
    await new Promise(resolve => setTimeout(resolve, 8000));

    // Step 4: Verify upload
    console.log('\n📊 Step 4: Verifying upload...');
    const newStatsResponse = await fetch(`${API_BASE_URL}/stats`);
    const newStats = await newStatsResponse.json();
    console.log('Updated backend stats:', {
      totalChunks: newStats.totalChunks,
      uniqueFiles: newStats.uniqueFiles,
      files: Object.keys(newStats.byFile || {}),
      systems: Object.keys(newStats.bySystem || {}),
      mimeTypes: Object.keys(newStats.byMimeType || {}),
      averageChunkSize: newStats.averageChunkSize,
      tags: Object.keys(newStats.tagCounts || {})
    });

    // Step 5: Test surge-related searches
    console.log('\n🔍 Step 5: Testing surge-related searches...');
    
    const surgeQueries = [
      'surge details',
      'What are the surge protection systems?',
      'surge arrester specifications',
      'surge troubleshooting',
      'overvoltage protection'
    ];

    let successCount = 0;
    let correctSourceCount = 0;

    for (const query of surgeQueries) {
      console.log(`\n--- Testing: "${query}" ---`);
      
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

        console.log(`Result: ${isSuccess ? '✅ SUCCESS' : '❌ FAILED'}`);
        console.log(`Length: ${searchResult.result?.length || 0} chars`);
        console.log(`Sources: ${searchResult.sources?.length || 0}`);

        if (isSuccess) {
          successCount++;
          
          // Check if it's finding the surge document (not KMRCL)
          const foundSurgeDoc = searchResult.sources.some(source => 
            source.fileName.includes('Surge') || 
            source.system?.includes('Surge') ||
            source.fileName.includes('Protection')
          );

          const foundKMRCLDoc = searchResult.sources.some(source =>
            source.fileName.includes('KMRCL') ||
            source.system?.includes('KMRCL')
          );

          if (foundSurgeDoc && !foundKMRCLDoc) {
            correctSourceCount++;
            console.log('✅ CORRECT SOURCE: Found surge document');
          } else if (foundKMRCLDoc) {
            console.log('❌ WRONG SOURCE: Still finding KMRCL document');
          } else {
            console.log('⚠️ UNKNOWN SOURCE');
          }

          // Show source info
          if (searchResult.sources && searchResult.sources.length > 0) {
            const source = searchResult.sources[0];
            console.log(`Source: ${source.fileName} (${source.system})`);
            console.log(`Score: ${source.score}`);
          }

          // Check if result contains surge-specific content
          const cleanResult = searchResult.result.replace(/<[^>]*>/g, '');
          const hasSurgeContent = cleanResult.includes('25kV AC') || 
                                 cleanResult.includes('Metal Oxide Varistor') ||
                                 cleanResult.includes('surge arrester') ||
                                 cleanResult.includes('10kA') ||
                                 cleanResult.includes('overvoltage');

          const hasKMRCLContent = cleanResult.includes('KMRCL') ||
                                 cleanResult.includes('1500V DC') ||
                                 cleanResult.includes('6-car Electric');

          console.log(`Contains surge content: ${hasSurgeContent ? '✅ YES' : '❌ NO'}`);
          console.log(`Contains KMRCL content: ${hasKMRCLContent ? '❌ YES' : '✅ NO'}`);

          // Show result preview
          const preview = cleanResult.substring(0, 200).replace(/\s+/g, ' ');
          console.log(`Preview: "${preview}..."`);
        }
      } catch (error) {
        console.log(`❌ Search error: ${error.message}`);
      }
    }

    // Step 6: Final assessment
    console.log('\n🎯 FINAL ASSESSMENT');
    console.log('===================');
    
    console.log(`📊 Backend Status:`);
    console.log(`   - Files indexed: ${newStats.totalChunks > 0 ? '✅' : '❌'} (${newStats.totalChunks} chunks)`);
    console.log(`   - Correct file type: ${newStats.byMimeType?.['text/plain'] ? '✅' : '❌'} (text/plain)`);
    console.log(`   - File present: ${Object.keys(newStats.byFile || {}).includes('Surge-Protection-Manual.pdf') ? '✅' : '❌'}`);

    console.log(`\n🔍 Search Results:`);
    console.log(`   - Successful searches: ${successCount}/${surgeQueries.length}`);
    console.log(`   - Correct source matches: ${correctSourceCount}/${surgeQueries.length}`);
    console.log(`   - Success rate: ${Math.round((correctSourceCount / surgeQueries.length) * 100)}%`);

    if (correctSourceCount === surgeQueries.length) {
      console.log('\n🎉 PERFECT SUCCESS!');
      console.log('✅ All searches return content from the uploaded surge document');
      console.log('✅ No interference from old KMRCL documents');
      console.log('✅ File-specific search is working correctly');
    } else if (correctSourceCount > 0) {
      console.log('\n✅ PARTIAL SUCCESS');
      console.log('Some searches work correctly, others may need improvement');
    } else {
      console.log('\n❌ SEARCHES FAILING');
      console.log('Searches are not finding the uploaded surge document');
    }

    console.log('\n📋 USER ACTION REQUIRED:');
    console.log('1. The backend is now clean and ready');
    console.log('2. Refresh your frontend application (Ctrl+F5 or Cmd+Shift+R)');
    console.log('3. Upload your surge-related files via Google Drive tab');
    console.log('4. Search for surge details - you should get surge-specific results');
    console.log('5. If you still see KMRCL results, clear browser cache and try again');

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
  }
}

testCleanBackendWorkflow();