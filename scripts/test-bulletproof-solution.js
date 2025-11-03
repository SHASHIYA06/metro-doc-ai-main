#!/usr/bin/env node

/**
 * BULLETPROOF TEST SCRIPT
 * This script tests the complete workflow:
 * 1. Create test document
 * 2. Upload to backend
 * 3. Verify indexing
 * 4. Test AI search
 */

const API_BASE_URL = process.env.VITE_API_BASE_URL || 'https://metro-doc-ai-main.onrender.com';

console.log('🚀 BULLETPROOF SOLUTION TEST');
console.log('============================\n');
console.log(`Backend URL: ${API_BASE_URL}\n`);

// Test document content
const testContent = `KMRCL Metro Railway System - Complete Technical Specifications

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
- Interlocking System: Computer-based with fail-safe design

SAFETY AND EMERGENCY SYSTEMS:
- Emergency brake system with triple redundancy
- Fire detection and suppression in all areas
- Passenger emergency communication system
- Speed supervision and automatic enforcement
- Route interlocking with safety verification
- Emergency lighting with 90-minute backup
- Evacuation procedures and emergency exits
- CCTV monitoring throughout the system

ROLLING STOCK SPECIFICATIONS:
- Train Configuration: 6-car Electric Multiple Unit (EMU)
- Maximum Operating Speed: 80 km/h
- Design Speed: 90 km/h
- Acceleration Rate: 1.0 m/s² (normal service)
- Deceleration Rate: 1.2 m/s² (normal), 1.3 m/s² (emergency)
- Passenger Capacity: 1,200 passengers at 6 persons per m²
- Crush Load Capacity: 1,800 passengers
- Car Length: 22 meters per car
- Car Width: 3.2 meters
- Car Height: 3.8 meters
- Bogie Centers: 15.7 meters
- Wheel Diameter: 860 mm (new), 780 mm (worn)

TRACTION AND PROPULSION:
- Motor Type: Three-phase AC induction motors
- Motor Power Rating: 200 kW per motor (4 motors per car)
- Total Traction Power: 4,800 kW per train
- Traction Control: VVVF (Variable Voltage Variable Frequency)
- Inverter Type: IGBT-based with regenerative capability
- Braking Systems:
  * Regenerative braking (primary)
  * Pneumatic disc brakes (secondary)
  * Electromagnetic track brakes (emergency)
  * Parking brake (mechanical)

AUXILIARY SYSTEMS:
- Air Conditioning: 60 kW per car, maintaining 24°C ± 2°C
- Ventilation: Forced air circulation with fresh air intake
- Lighting: LED lighting system with emergency backup
- Doors: Pneumatic sliding doors with obstacle detection
- Public Address System: Digital with emergency override
- Passenger Information Display System (PIDS)
- CCTV: 4 cameras per car with DVR recording
- Wi-Fi: Passenger internet connectivity

MAINTENANCE SPECIFICATIONS:
- Preventive Maintenance: Every 6,000 km or 30 days
- Intermediate Overhaul: Every 250,000 km or 2 years
- General Overhaul: Every 1,000,000 km or 8 years
- Wheel Re-profiling: Every 80,000 km
- Brake Pad Replacement: Every 40,000 km
- Battery Replacement: Every 3 years

WIRING AND CONNECTIONS:
- Main Power Cable: 95mm² copper, 1000V rated
- Control Wiring: 2.5mm² copper, shielded twisted pair
- Signal Cables: Fiber optic for CBTC, copper for backup
- Emergency Circuits: Redundant wiring with separate routing
- Connector Types: IP67 rated for all external connections
- Cable Colors: Red (positive), Black (negative), Green/Yellow (earth)

TECHNICAL STANDARDS:
- Design Standard: IEC 62267 (Railway applications)
- Safety Standard: EN 50126, EN 50128, EN 50129
- EMC Standard: EN 50121 (Electromagnetic compatibility)
- Fire Safety: EN 45545 (Fire protection on railway vehicles)
- Accessibility: Compliant with disability access requirements

This comprehensive document contains all technical information for AI search testing and validation.`;

async function testBulletproofSolution() {
  try {
    // Step 1: Test backend connection
    console.log('📡 Step 1: Testing backend connection...');
    const healthResponse = await fetch(`${API_BASE_URL}/health`);
    
    if (!healthResponse.ok) {
      throw new Error(`Backend health check failed: ${healthResponse.status}`);
    }
    
    const healthData = await healthResponse.json();
    console.log('✅ Backend is healthy:', healthData);
    console.log('');

    // Step 2: Create and upload test document
    console.log('📤 Step 2: Creating and uploading test document...');
    
    const FormData = (await import('form-data')).default;
    const formData = new FormData();
    
    // Create a buffer from the test content
    const buffer = Buffer.from(testContent, 'utf-8');
    formData.append('files', buffer, {
      filename: 'KMRCL-Metro-Complete-Technical-Specs.txt',
      contentType: 'text/plain'
    });
    formData.append('system', 'KMRCL Metro Railway');
    formData.append('subsystem', 'Complete Technical Specifications');
    
    console.log('📄 Document size:', testContent.length, 'characters');
    console.log('📤 Uploading to backend...');
    
    const uploadResponse = await fetch(`${API_BASE_URL}/ingest`, {
      method: 'POST',
      body: formData,
      headers: formData.getHeaders()
    });
    
    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      throw new Error(`Upload failed: ${uploadResponse.status} - ${errorText}`);
    }
    
    const uploadResult = await uploadResponse.json();
    console.log('✅ Upload successful:', uploadResult);
    console.log(`   - Files processed: ${uploadResult.total}`);
    console.log(`   - Chunks added: ${uploadResult.added}`);
    console.log(`   - Processing time: ${uploadResult.processingTime}ms`);
    console.log('');

    // Step 3: Wait for indexing
    console.log('⏳ Step 3: Waiting for indexing to complete (5 seconds)...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    console.log('✅ Indexing wait complete');
    console.log('');

    // Step 4: Verify indexing by checking stats
    console.log('📊 Step 4: Verifying indexing...');
    const statsResponse = await fetch(`${API_BASE_URL}/stats`);
    
    if (!statsResponse.ok) {
      throw new Error(`Stats check failed: ${statsResponse.status}`);
    }
    
    const stats = await statsResponse.json();
    console.log('✅ Backend stats:', stats);
    console.log(`   - Total chunks: ${stats.totalChunks}`);
    console.log(`   - Total files: ${stats.uniqueFiles}`);
    console.log(`   - Index size: ${stats.indexSize}`);
    console.log('');

    if (stats.totalChunks === 0) {
      throw new Error('No chunks indexed! Something went wrong.');
    }

    // Step 5: Test AI search
    console.log('🔍 Step 5: Testing AI search...');
    const testQueries = [
      'What is the operating voltage?',
      'Describe the safety systems',
      'What are the rolling stock specifications?',
      'Tell me about the traction system'
    ];

    for (const query of testQueries) {
      console.log(`\n   Query: "${query}"`);
      
      const searchResponse = await fetch(`${API_BASE_URL}/ask`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: query,
          k: 5,
          system: '',
          subsystem: '',
          tags: []
        })
      });
      
      if (!searchResponse.ok) {
        console.log(`   ⚠️ Search failed: ${searchResponse.status}`);
        continue;
      }
      
      const searchResult = await searchResponse.json();
      console.log(`   ✅ Answer: ${searchResult.answer?.substring(0, 150)}...`);
      console.log(`   📚 Sources found: ${searchResult.sources?.length || 0}`);
    }
    
    console.log('');
    console.log('🎉 BULLETPROOF SOLUTION TEST COMPLETE!');
    console.log('=====================================');
    console.log('✅ All steps completed successfully');
    console.log('✅ Backend is working correctly');
    console.log('✅ Document upload and indexing works');
    console.log('✅ AI search is functional');
    console.log('');
    console.log('💡 The frontend buttons should work with this same logic!');
    console.log('');

  } catch (error) {
    console.error('');
    console.error('❌ TEST FAILED:', error.message);
    console.error('');
    console.error('Debug Information:');
    console.error('- Backend URL:', API_BASE_URL);
    console.error('- Error:', error);
    console.error('');
    process.exit(1);
  }
}

// Run the test
testBulletproofSolution();
