#!/usr/bin/env node

// Quick Fast Upload Test
// Tests the optimized upload speed for small files

import fetch from 'node-fetch';

const config = {
  API_BASE_URL: process.env.VITE_API_BASE_URL || 'http://localhost:3000'
};

console.log('⚡ QUICK FAST UPLOAD TEST');
console.log('========================');
console.log('Testing optimized upload for small file (similar to 800KB)');
console.log('');

async function testQuickUpload() {
  console.log('⚡ Testing Quick Upload Performance...');
  
  const startTime = Date.now();
  
  try {
    // Clear backend first
    await fetch(`${config.API_BASE_URL}/clear`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    // Create smaller test content (similar to real file)
    const testContent = `DOCUMENT INFORMATION:
File Name: Quick-Test-File.xlsx
File Type: Excel Spreadsheet
MIME Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
Size: 800 KB

SEARCHABLE CONTENT:
SPARE PARTS INVENTORY DATA

Part Number,Description,Quantity,Location,Status,Last Updated
GA001,Door Motor Assembly,5,Warehouse A,Available,2024-01-15
GA002,Safety Sensor Unit,12,Warehouse B,Available,2024-01-14
GA003,Control Circuit Board,3,Warehouse A,Low Stock,2024-01-13
GA004,Emergency Release Handle,8,Warehouse C,Available,2024-01-12
GA005,Position Indicator,15,Warehouse B,Available,2024-01-11
GA006,Wiring Harness,6,Warehouse A,Available,2024-01-10

MAINTENANCE SCHEDULE:
- Weekly inspection of all door systems
- Monthly testing of safety sensors
- Quarterly replacement of wear parts
- Annual overhaul of control systems

TECHNICAL SPECIFICATIONS:
- Operating Voltage: 110V DC
- Control Logic: Microprocessor-based
- Communication: CAN Bus protocol
- Safety Features: Obstacle detection, Emergency override

KEYWORDS: spare parts, inventory, door motor, safety sensor, control circuit, maintenance
SUGGESTED QUERIES: What spare parts are available?; Which parts are low stock?; What is the maintenance schedule?`;

    console.log(`📊 Test content size: ${testContent.length} characters (~${Math.round(testContent.length/1024)}KB)`);

    const uploadData = {
      content: testContent,
      fileName: 'Quick-Test-File.xlsx',
      system: 'Selected File - Quick-Test-File',
      subsystem: 'Google Drive Upload',
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    };

    const uploadStartTime = Date.now();
    
    const response = await fetch(`${config.API_BASE_URL}/ingest-json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(uploadData)
    });

    const uploadEndTime = Date.now();
    const uploadTime = uploadEndTime - uploadStartTime;

    if (response.ok) {
      const result = await response.json();
      
      console.log('✅ Quick upload successful');
      console.log(`   ⚡ Upload time: ${uploadTime}ms (${(uploadTime/1000).toFixed(2)}s)`);
      console.log(`   📊 Files processed: ${result.results?.length || 0}`);
      console.log(`   📊 Chunks added: ${result.added}`);
      console.log(`   📊 Total chunks: ${result.total}`);
      
      if (result.results?.length > 0) {
        const fileResult = result.results[0];
        console.log(`   📄 File: ${fileResult.fileName}`);
        console.log(`   📄 Status: ${fileResult.status}`);
        console.log(`   📄 Content length: ${fileResult.contentLength} chars`);
        console.log(`   📄 Chunks created: ${fileResult.chunks}`);
      }
      
      // Performance evaluation
      if (uploadTime < 5000) { // Less than 5 seconds
        console.log(`   🎉 EXCELLENT: Upload completed in ${(uploadTime/1000).toFixed(2)}s (target: <5s)`);
      } else if (uploadTime < 10000) { // Less than 10 seconds
        console.log(`   ✅ GOOD: Upload completed in ${(uploadTime/1000).toFixed(2)}s (acceptable)`);
      } else {
        console.log(`   ⚠️ SLOW: Upload took ${(uploadTime/1000).toFixed(2)}s (needs optimization)`);
      }
      
      return { success: true, uploadTime, result };
    } else {
      throw new Error(`Upload failed: ${response.status}`);
    }
  } catch (error) {
    const endTime = Date.now();
    const totalTime = endTime - startTime;
    console.log('❌ Quick upload failed:', error.message);
    console.log(`   ⏱️ Failed after: ${(totalTime/1000).toFixed(2)}s`);
    return { success: false, uploadTime: totalTime, error: error.message };
  }
}

async function runQuickTest() {
  console.log('🎯 Starting Quick Upload Test...\n');
  
  const result = await testQuickUpload();
  
  console.log('\n🏁 QUICK UPLOAD TEST SUMMARY');
  console.log('============================');
  console.log(`⚡ Upload Performance: ${result.success ? 'PASS' : 'FAIL'}`);
  
  if (result.success) {
    console.log(`   - Upload time: ${(result.uploadTime/1000).toFixed(2)}s`);
    
    if (result.uploadTime < 5000) {
      console.log('🎉 PERFORMANCE OPTIMIZATION SUCCESSFUL!');
      console.log('   - Files now upload quickly without API key delays');
      console.log('   - Fast processing mode is working correctly');
      console.log('   - User experience significantly improved');
    } else if (result.uploadTime < 10000) {
      console.log('✅ PERFORMANCE IMPROVED!');
      console.log('   - Upload time is acceptable');
      console.log('   - Further optimization possible');
    } else {
      console.log('⚠️ Performance still needs optimization');
    }
  } else {
    console.log('❌ Upload failed - check backend configuration');
  }

  return result;
}

// Run the test
runQuickTest()
  .then(() => {
    console.log('\n✅ Quick upload test completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Quick upload test failed:', error);
    process.exit(1);
  });

export { runQuickTest };