#!/usr/bin/env node

/**
 * COMPLETE AI WORKFLOW TEST
 * Tests the entire process: Upload → Index → Search → Results
 */

const API_BASE_URL = process.env.VITE_API_BASE_URL || 'https://metro-doc-ai-main.onrender.com';

console.log('🔥 COMPLETE AI WORKFLOW TEST');
console.log('============================\n');
console.log(`Backend URL: ${API_BASE_URL}\n`);

async function testCompleteWorkflow() {
  try {
    // Step 1: Clear any existing data
    console.log('🧹 Step 1: Clearing existing data...');
    try {
      const clearResponse = await fetch(`${API_BASE_URL}/clear`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (clearResponse.ok) {
        const clearResult = await clearResponse.json();
        console.log('✅ Cleared:', clearResult);
      }
    } catch (e) {
      console.log('⚠️ Clear failed (might not exist):', e.message);
    }

    // Step 2: Upload test document
    console.log('\n📤 Step 2: Uploading comprehensive test document...');
    
    const testContent = `KMRCL Metro Railway System - Complete Technical Documentation

ELECTRICAL POWER SYSTEMS:
- Main Operating Voltage: 25kV AC, 50Hz overhead catenary system
- Traction Power Supply: 1500V DC third rail system
- Auxiliary Power: 415V AC, 3-phase for station equipment
- Control Voltage: 110V DC with battery backup
- Emergency Power: Diesel generator sets with automatic changeover

SIGNALING AND TRAIN CONTROL:
- Primary System: CBTC (Communication Based Train Control)
- Automatic Train Protection (ATP) - Ensures safe train separation
- Automatic Train Operation (ATO) - Automated driving capability
- Automatic Train Supervision (ATS) - Central control monitoring
- Centralized Traffic Control (CTC) - Network-wide coordination
- Platform Screen Doors (PSD) integration with train control

SAFETY AND EMERGENCY SYSTEMS:
- Emergency brake system with triple redundancy
- Fire detection and suppression in all areas
- Passenger emergency communication system
- Speed supervision and automatic enforcement
- Route interlocking with safety verification
- Emergency lighting with 90-minute backup

ROLLING STOCK SPECIFICATIONS:
- Train Configuration: 6-car Electric Multiple Unit (EMU)
- Maximum Operating Speed: 80 km/h
- Design Speed: 90 km/h
- Acceleration Rate: 1.0 m/s² (normal service)
- Deceleration Rate: 1.2 m/s² (normal), 1.3 m/s² (emergency)
- Passenger Capacity: 1,200 passengers at 6 persons per m²
- Car Length: 22 meters per car
- Car Width: 3.2 meters
- Car Height: 3.8 meters

TRACTION AND PROPULSION:
- Motor Type: Three-phase AC induction motors
- Motor Power Rating: 200 kW per motor (4 motors per car)
- Total Traction Power: 4,800 kW per train
- Traction Control: VVVF (Variable Voltage Variable Frequency)
- Inverter Type: IGBT-based with regenerative capability

MAINTENANCE SPECIFICATIONS:
- Preventive Maintenance: Every 6,000 km or 30 days
- Intermediate Overhaul: Every 250,000 km or 2 years
- General Overhaul: Every 1,000,000 km or 8 years
- Wheel Re-profiling: Every 80,000 km
- Brake Pad Replacement: Every 40,000 km

This comprehensive document contains detailed technical information for AI search testing.`;

    const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
    let body = '';
    body += `--${boundary}\r\n`;
    body += `Content-Disposition: form-data; name="files"; filename="KMRCL-Complete-Tech-Specs.txt"\r\n`;
    body += `Content-Type: text/plain\r\n\r\n`;
    body += testContent;
    body += `\r\n--${boundary}\r\n`;
    body += `Content-Disposition: form-data; name="system"\r\n\r\n`;
    body += 'KMRCL Metro Railway';
    body += `\r\n--${boundary}\r\n`;
    body += `Content-Disposition: form-data; name="subsystem"\r\n\r\n`;
    body += 'Complete Technical Specifications';
    body += `\r\n--${boundary}--\r\n`;
    
    const uploadResponse = await fetch(`${API_BASE_URL}/ingest`, {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`
      },
      body: body
    });
    
    if (!uploadResponse.ok) {
      throw new Error(`Upload failed: ${uploadResponse.status}`);
    }
    
    const uploadResult = await uploadResponse.json();
    console.log('✅ Upload successful:', uploadResult);
    console.log(`   - Files processed: ${uploadResult.total}`);
    console.log(`   - Chunks added: ${uploadResult.added}`);

    // Step 3: Wait for indexing
    console.log('\n⏳ Step 3: Waiting for indexing (8 seconds)...');
    await new Promise(resolve => setTimeout(resolve, 8000));

    // Step 4: Verify indexing with stats
    console.log('\n📊 Step 4: Verifying indexing...');
    const statsResponse = await fetch(`${API_BASE_URL}/stats`);
    if (!statsResponse.ok) {
      throw new Error(`Stats check failed: ${statsResponse.status}`);
    }
    
    const stats = await statsResponse.json();
    console.log('✅ Backend stats:', stats);
    console.log(`   - Total chunks: ${stats.totalChunks}`);
    console.log(`   - Total files: ${stats.uniqueFiles}`);

    if (stats.totalChunks === 0) {
      throw new Error('❌ No chunks indexed! Upload or indexing failed.');
    }

    // Step 5: Test multiple AI search queries
    console.log('\n🔍 Step 5: Testing AI search with multiple queries...');
    
    const testQueries = [
      'What is the operating voltage?',
      'Describe the safety systems',
      'What are the rolling stock specifications?',
      'Tell me about the traction system',
      'What is the maintenance schedule?'
    ];

    let successfulSearches = 0;
    
    for (const query of testQueries) {
      console.log(`\n   🔍 Testing: "${query}"`);
      
      try {
        const searchResponse = await fetch(`${API_BASE_URL}/ask`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            query: query,
            k: 10,
            system: '',
            subsystem: '',
            tags: []
          })
        });
        
        if (!searchResponse.ok) {
          console.log(`   ❌ Search failed: HTTP ${searchResponse.status}`);
          continue;
        }
        
        const searchResult = await searchResponse.json();
        
        console.log(`   ✅ Search successful!`);
        console.log(`      - Has result: ${!!searchResult.result}`);
        console.log(`      - Result length: ${searchResult.result?.length || 0} chars`);
        console.log(`      - Sources found: ${searchResult.sources?.length || 0}`);
        console.log(`      - Used chunks: ${searchResult.used || 0}`);
        
        if (searchResult.result && searchResult.result.length > 0) {
          console.log(`      - Answer preview: ${searchResult.result.substring(0, 150)}...`);
          successfulSearches++;
        } else {
          console.log(`      ⚠️ No result content returned`);
        }
        
      } catch (searchError) {
        console.log(`   ❌ Search error: ${searchError.message}`);
      }
    }

    // Step 6: Summary
    console.log('\n🎉 WORKFLOW TEST COMPLETE!');
    console.log('==========================');
    console.log(`✅ Upload: SUCCESS (${uploadResult.added} chunks)`);
    console.log(`✅ Indexing: SUCCESS (${stats.totalChunks} total chunks)`);
    console.log(`✅ AI Search: ${successfulSearches}/${testQueries.length} queries successful`);
    
    if (successfulSearches === testQueries.length) {
      console.log('\n🎉 ALL TESTS PASSED! AI Search is working correctly!');
      console.log('\n💡 FRONTEND SHOULD WORK NOW:');
      console.log('1. Upload files using Google Drive buttons');
      console.log('2. Wait for indexing (files will be processed)');
      console.log('3. Use AI Search tab to ask questions');
      console.log('4. Results should appear in Results tab');
    } else {
      console.log('\n⚠️ SOME SEARCHES FAILED');
      console.log('Backend may have issues with AI processing');
    }

  } catch (error) {
    console.error('\n❌ WORKFLOW TEST FAILED:', error.message);
    console.error('\nDebug Information:');
    console.error('- Backend URL:', API_BASE_URL);
    console.error('- Error:', error);
  }
}

testCompleteWorkflow();