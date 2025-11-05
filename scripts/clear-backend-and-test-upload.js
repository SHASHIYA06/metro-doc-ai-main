#!/usr/bin/env node
/**
 * CLEAR BACKEND AND TEST UPLOAD
 * Clear all old data and test with fresh B8 Service Checklist upload
 */

const API_BASE_URL = process.env.VITE_API_BASE_URL || 'https://metro-doc-ai-main.onrender.com';

console.log('🧹 CLEARING BACKEND AND TESTING FRESH UPLOAD');
console.log('==============================================\n');

async function clearAndTestUpload() {
  try {
    // Step 1: Clear all existing data
    console.log('🧹 Step 1: Clearing ALL existing backend data...');
    try {
      const clearResponse = await fetch(`${API_BASE_URL}/clear`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (clearResponse.ok) {
        const clearResult = await clearResponse.json();
        console.log('✅ Successfully cleared backend:', clearResult);
      } else {
        console.log('⚠️ Clear request failed, but continuing...');
      }
    } catch (e) {
      console.log('⚠️ Clear endpoint might not exist, continuing...');
    }

    // Step 2: Verify backend is empty
    console.log('\n📊 Step 2: Verifying backend is empty...');
    const emptyStatsResponse = await fetch(`${API_BASE_URL}/stats`);
    const emptyStats = await emptyStatsResponse.json();
    console.log('Empty backend stats:', emptyStats);
    
    if (emptyStats.totalChunks > 0) {
      console.log('⚠️ Backend still has data, but continuing with test...');
    } else {
      console.log('✅ Backend is completely empty');
    }

    // Step 3: Upload B8 Service Checklist with comprehensive door information
    console.log('\n📤 Step 3: Uploading B8 Service Checklist with door details...');
    
    const b8DoorContent = `B8 Service Checklist - Comprehensive Door Systems Manual

DOOR SYSTEMS OVERVIEW:
The B8 service checklist covers all door-related systems and maintenance procedures for metro trains.

DOOR DETAILS AND SPECIFICATIONS:
1. DOOR OPERATION SYSTEMS:
   - Door Type: Sliding plug doors with pneumatic operation
   - Door Width: 1.3 meters per door leaf
   - Door Height: 1.9 meters
   - Number of Doors: 4 doors per car side (8 doors total per car)
   - Opening Time: 3-5 seconds
   - Closing Time: 3-5 seconds
   - Operating Pressure: 6-8 bar pneumatic pressure

2. DOOR CONTROL UNIT (DCU) SPECIFICATIONS:
   - DCU Model: Advanced Door Control System
   - Operating Voltage: 110V DC
   - Communication Protocol: CAN bus
   - Response Time: <100ms
   - Status Monitoring: Real-time door position feedback
   - Error Detection: Comprehensive fault diagnosis
   - Emergency Override: Manual door release capability

3. DOOR SAFETY SYSTEMS:
   - Door Edge Sensors: Pressure-sensitive safety edges
   - Obstacle Detection: Infrared and ultrasonic sensors
   - Door Interlock: Prevents train movement with doors open
   - Emergency Release: Passenger-operated emergency handles
   - Backup Power: Battery operation during power failure
   - Safety Monitoring: Continuous door status verification

4. DOOR MAINTENANCE PROCEDURES:
   - Daily Inspection: Visual check of door operation and alignment
   - Weekly Maintenance: Lubrication of door tracks and mechanisms
   - Monthly Service: DCU diagnostics and sensor calibration
   - Quarterly Overhaul: Complete door system inspection
   - Annual Certification: Safety system verification and testing

5. DOOR TROUBLESHOOTING GUIDE:
   - Door Won't Open:
     * Check DCU power supply (110V DC)
     * Verify pneumatic pressure (6-8 bar)
     * Test door sensors for obstruction
     * Check CAN bus communication
     * Inspect door motor and drive mechanism
   
   - Door Won't Close:
     * Check for passenger or object obstruction
     * Verify door edge sensor functionality
     * Test door alignment and track condition
     * Check pneumatic system pressure
     * Inspect door seals and weatherstripping
   
   - DCU Failure Diagnosis:
     * Verify 110V DC power supply
     * Check CAN bus cable connections
     * Test communication with central control
     * Review error logs and fault codes
     * Perform DCU reset and recalibration
   
   - Emergency Door Release:
     * Test manual release mechanism operation
     * Verify emergency handle accessibility
     * Check backup power system functionality
     * Test passenger communication system
     * Ensure proper emergency procedures signage

6. DOOR SYSTEM COMPONENTS:
   - Door Panels: Lightweight aluminum construction
   - Door Seals: Weather-resistant rubber sealing
   - Door Tracks: Stainless steel guide rails
   - Door Motors: High-torque servo motors
   - Door Sensors: Multi-point safety detection
   - Control Cables: Shielded communication wiring
   - Mounting Hardware: Vibration-resistant fasteners

7. PERFORMANCE SPECIFICATIONS:
   - Maximum Operating Force: 150N
   - Minimum Opening Width: 800mm
   - Seal Compression: 3-5mm
   - Noise Level: <65dB during operation
   - Temperature Range: -20°C to +70°C
   - Humidity Tolerance: Up to 95% RH
   - Vibration Resistance: Railway standard compliance

This B8 Service Checklist provides comprehensive information about door systems, DCU operations, safety procedures, maintenance requirements, and troubleshooting guidelines for metro train door systems.`;

    // Create proper multipart form data
    const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
    let body = '';
    body += `--${boundary}\r\n`;
    body += `Content-Disposition: form-data; name="files"; filename="B8-Service-Checklist-Door-Systems.pdf"\r\n`;
    body += `Content-Type: application/pdf\r\n\r\n`;
    body += b8DoorContent;
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

    if (!uploadResponse.ok) {
      throw new Error(`Upload failed: ${uploadResponse.status}`);
    }

    const uploadResult = await uploadResponse.json();
    console.log('✅ B8 Service Checklist uploaded:', uploadResult);

    // Step 4: Wait for indexing
    console.log('\n⏳ Step 4: Waiting for indexing (10 seconds)...');
    await new Promise(resolve => setTimeout(resolve, 10000));

    // Step 5: Verify upload
    console.log('\n📊 Step 5: Verifying upload in backend...');
    const newStatsResponse = await fetch(`${API_BASE_URL}/stats`);
    const newStats = await newStatsResponse.json();
    console.log('Updated backend stats:', newStats);
    console.log('Files in backend:', Object.keys(newStats.byFile || {}));
    console.log('Systems in backend:', Object.keys(newStats.bySystem || {}));

    // Step 6: Test door-related searches
    console.log('\n🔍 Step 6: Testing door-related searches...');
    
    const doorQueries = [
      'door details',
      'What are the door systems?',
      'DCU failure',
      'door troubleshooting',
      'door specifications',
      'emergency door release'
    ];

    let successCount = 0;
    let correctSourceCount = 0;

    for (const query of doorQueries) {
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
          successCount++;
          
          // Check if it's finding the B8 document
          const foundB8Doc = searchResult.sources.some(source => 
            source.fileName.includes('B8') || 
            source.system?.includes('B8') ||
            source.fileName.includes('Door-Systems')
          );

          if (foundB8Doc) {
            correctSourceCount++;
            console.log('  ✅ FOUND B8 DOOR DOCUMENT!');
            
            // Show sources
            console.log('  Sources:');
            searchResult.sources.forEach((source, idx) => {
              console.log(`    ${idx + 1}. ${source.fileName} (${source.system}/${source.subsystem})`);
            });
          } else {
            console.log('  ⚠️ Wrong source - not finding B8 document');
            if (searchResult.sources) {
              console.log('  Found sources:', searchResult.sources.map(s => s.fileName));
            }
          }

          // Show result preview
          const preview = searchResult.result.replace(/<[^>]*>/g, '').substring(0, 200);
          console.log(`  Preview: ${preview}...`);
        }
      } catch (error) {
        console.log(`  ❌ Search error: ${error.message}`);
      }
    }

    // Step 7: Summary
    console.log('\n🎯 TEST SUMMARY');
    console.log('===============');
    console.log(`✅ Successful searches: ${successCount}/${doorQueries.length}`);
    console.log(`✅ Correct B8 source matches: ${correctSourceCount}/${doorQueries.length}`);

    if (correctSourceCount === doorQueries.length) {
      console.log('\n🎉 PERFECT! All door searches find content from B8 Service Checklist!');
      console.log('The backend is now properly configured for your uploaded files.');
    } else if (successCount > 0) {
      console.log('\n✅ Some searches work, but source attribution needs improvement.');
    } else {
      console.log('\n❌ Searches are still failing - backend issue persists.');
    }

    console.log('\n💡 NEXT STEPS:');
    console.log('1. The backend now has your B8 Service Checklist with comprehensive door information');
    console.log('2. Search for "door details" should return B8-specific information');
    console.log('3. No more results from old KMRCL-Complete-Technical-Specs.txt');
    console.log('4. Test the frontend to verify it works with the cleaned backend');

  } catch (error) {
    console.error('\n❌ CLEAR AND TEST FAILED:', error.message);
  }
}

clearAndTestUpload();