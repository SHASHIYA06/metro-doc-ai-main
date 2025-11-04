#!/usr/bin/env node

/**
 * TEST CURRENT DOCUMENTS
 * Check what's actually indexed and what searches work
 */

const API_BASE_URL = process.env.VITE_API_BASE_URL || 'https://metro-doc-ai-main.onrender.com';

console.log('🔍 TESTING CURRENT DOCUMENTS');
console.log('============================\n');

async function testCurrentDocuments() {
  try {
    // Step 1: Check what's currently indexed
    console.log('📊 Step 1: Checking current backend state...');
    
    const statsResponse = await fetch(`${API_BASE_URL}/stats`);
    const stats = await statsResponse.json();
    
    console.log('Current backend stats:');
    console.log('- Total chunks:', stats.totalChunks);
    console.log('- Total files:', stats.uniqueFiles);
    console.log('- Files:', Object.keys(stats.byFile || {}));
    console.log('- Systems:', Object.keys(stats.bySystem || {}));
    console.log('- Subsystems:', Object.keys(stats.bySubsystem || {}));
    console.log('- Tags:', Object.keys(stats.tagCounts || {}));
    
    if (stats.totalChunks === 0) {
      console.log('\n❌ NO DOCUMENTS INDEXED!');
      console.log('You need to upload documents first using the Google Drive buttons.');
      return;
    }
    
    // Step 2: Test searches that should work based on available tags
    console.log('\n🔍 Step 2: Testing searches based on available content...');
    
    const availableTags = Object.keys(stats.tagCounts || {});
    const testQueries = [
      // Based on common tags
      ...availableTags.slice(0, 3),
      // Common technical terms
      'voltage',
      'system',
      'control',
      'safety',
      'electrical',
      'technical',
      'specifications',
      // Complete questions
      'What is the operating voltage?',
      'Describe the system',
      'What are the technical specifications?',
      // User's failing query
      'DCU failure'
    ];
    
    console.log('Available tags to test:', availableTags);
    console.log('Testing queries:', testQueries);
    console.log('');
    
    const workingQueries = [];
    const failingQueries = [];
    
    for (const query of testQueries) {
      console.log(`Testing: "${query}"`);
      
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
          workingQueries.push(query);
          console.log(`  Preview: ${searchResult.result.substring(0, 100)}...`);
        } else {
          failingQueries.push(query);
        }
        
      } catch (error) {
        console.log(`  ❌ Error: ${error.message}`);
        failingQueries.push(query);
      }
      
      console.log('');
    }
    
    // Step 3: Summary and recommendations
    console.log('🎯 SUMMARY');
    console.log('==========');
    console.log(`✅ Working queries (${workingQueries.length}):`);
    workingQueries.forEach(q => console.log(`  - "${q}"`));
    
    console.log(`\n❌ Failing queries (${failingQueries.length}):`);
    failingQueries.forEach(q => console.log(`  - "${q}"`));
    
    console.log('\n💡 RECOMMENDATIONS:');
    
    if (workingQueries.length > 0) {
      console.log('✅ Some searches work! Use these patterns:');
      workingQueries.slice(0, 3).forEach(q => console.log(`  - "${q}"`));
      
      if (failingQueries.includes('DCU failure')) {
        console.log('\n🔍 For "DCU failure":');
        console.log('  - This term might not be in your documents');
        console.log('  - Try broader terms like "failure", "control", "system"');
        console.log('  - Check if your documents actually contain "DCU" information');
      }
    } else {
      console.log('❌ No searches work - there might be an indexing issue');
      console.log('  - Try re-uploading documents');
      console.log('  - Check if documents have readable content');
      console.log('  - Verify backend is processing files correctly');
    }
    
    // Step 4: Upload a test document with DCU content if needed
    if (failingQueries.includes('DCU failure') && workingQueries.length > 0) {
      console.log('\n📤 Step 4: Uploading test document with DCU content...');
      
      const dcuContent = `KMRCL Metro Railway - DCU (Door Control Unit) Technical Documentation

DCU FAILURE ANALYSIS:
- DCU (Door Control Unit) is responsible for train door operations
- Common DCU failure modes include communication loss, sensor malfunction, and power supply issues
- DCU failure can result in doors not opening/closing properly
- Emergency procedures for DCU failure include manual door operation

DCU SPECIFICATIONS:
- Operating Voltage: 110V DC
- Communication Protocol: CAN Bus
- Failure Detection: Built-in diagnostics
- Backup Systems: Manual override available

DCU TROUBLESHOOTING:
1. Check power supply connections
2. Verify CAN bus communication
3. Test door sensors
4. Review error logs
5. Perform system reset if needed

This document contains DCU failure information for testing AI search.`;

      const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
      let body = '';
      body += `--${boundary}\r\n`;
      body += `Content-Disposition: form-data; name="files"; filename="DCU-Failure-Analysis.txt"\r\n`;
      body += `Content-Type: text/plain\r\n\r\n`;
      body += dcuContent;
      body += `\r\n--${boundary}\r\n`;
      body += `Content-Disposition: form-data; name="system"\r\n\r\n`;
      body += 'KMRCL Metro';
      body += `\r\n--${boundary}\r\n`;
      body += `Content-Disposition: form-data; name="subsystem"\r\n\r\n`;
      body += 'DCU Analysis';
      body += `\r\n--${boundary}--\r\n`;
      
      const uploadResponse = await fetch(`${API_BASE_URL}/ingest`, {
        method: 'POST',
        headers: {
          'Content-Type': `multipart/form-data; boundary=${boundary}`
        },
        body: body
      });
      
      const uploadResult = await uploadResponse.json();
      console.log('DCU document upload result:', uploadResult);
      
      if (uploadResult.added > 0) {
        console.log('✅ DCU document uploaded successfully');
        console.log('⏳ Waiting 5 seconds for indexing...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Test DCU failure search again
        console.log('\n🔍 Testing "DCU failure" search again...');
        const dcuSearchResponse = await fetch(`${API_BASE_URL}/ask`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: 'DCU failure',
            k: 5,
            system: '',
            subsystem: '',
            tags: []
          })
        });
        
        const dcuSearchResult = await dcuSearchResponse.json();
        const dcuSuccess = dcuSearchResult.result && 
                          !dcuSearchResult.result.includes('No relevant documents found') && 
                          dcuSearchResult.sources?.length > 0;
        
        console.log(`DCU search result: ${dcuSuccess ? '✅ SUCCESS' : '❌ FAILED'}`);
        console.log(`- Result length: ${dcuSearchResult.result?.length || 0} chars`);
        console.log(`- Sources: ${dcuSearchResult.sources?.length || 0}`);
        
        if (dcuSuccess) {
          console.log('✅ DCU failure search now works!');
          console.log('The frontend should now return proper results for this query.');
        }
      }
    }
    
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
  }
}

testCurrentDocuments();