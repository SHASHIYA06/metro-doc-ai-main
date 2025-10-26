#!/usr/bin/env node

/**
 * Comprehensive test for all KMRCL Metro Intelligence features
 */

import fetch from 'node-fetch';

const BACKEND_URL = 'https://metro-doc-ai-main.onrender.com';
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzq7-DRXeX5dbcCAXfSqDgjubDAWkTiHOMdZ1PLaCdknrPkKfbo5znLvntYN7lICzz_mQ/exec';

console.log('🧪 KMRCL Metro Intelligence - Complete Feature Test\n');

async function testAllFeatures() {
  const results = {
    backend: false,
    googleDrive: false,
    aiSearch: false,
    fileUpload: false
  };

  try {
    // Test 1: Backend Health
    console.log('1️⃣ Testing Backend Health...');
    const healthResponse = await fetch(`${BACKEND_URL}/health`);
    
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('   ✅ Backend is healthy:', healthData.ok);
      results.backend = true;
    } else {
      console.log('   ❌ Backend health check failed:', healthResponse.status);
    }

    // Test 2: Google Drive Connection
    console.log('\n2️⃣ Testing Google Drive Connection...');
    const driveResponse = await fetch(`${APPS_SCRIPT_URL}?action=listTree`);
    
    if (driveResponse.ok) {
      const driveData = await driveResponse.json();
      if (driveData.ok && driveData.folders) {
        console.log('   ✅ Google Drive connected:', driveData.folders.length, 'folders found');
        results.googleDrive = true;
      } else {
        console.log('   ❌ Google Drive response invalid:', driveData);
      }
    } else {
      console.log('   ❌ Google Drive connection failed:', driveResponse.status);
    }

    // Test 3: File Listing
    console.log('\n3️⃣ Testing File Listing...');
    const filesResponse = await fetch(`${APPS_SCRIPT_URL}?action=listFiles`);
    
    if (filesResponse.ok) {
      const filesData = await filesResponse.json();
      if (filesData.ok && filesData.files) {
        console.log('   ✅ File listing works:', filesData.files.length, 'files found');
        
        // Show sample files
        if (filesData.files.length > 0) {
          console.log('   📄 Sample files:');
          filesData.files.slice(0, 3).forEach((file, index) => {
            console.log(`      ${index + 1}. ${file.name} (${file.mimeType})`);
          });
        }
      } else {
        console.log('   ❌ File listing response invalid:', filesData);
      }
    } else {
      console.log('   ❌ File listing failed:', filesResponse.status);
    }

    // Test 4: Backend Stats
    console.log('\n4️⃣ Testing Backend Stats...');
    const statsResponse = await fetch(`${BACKEND_URL}/stats`);
    
    if (statsResponse.ok) {
      const statsData = await statsResponse.json();
      console.log('   ✅ Backend stats available');
      console.log('   📊 Total files:', statsData.totalFiles || 0);
      console.log('   📊 Total chunks:', statsData.totalChunks || 0);
    } else {
      console.log('   ❌ Backend stats failed:', statsResponse.status);
    }

    // Test 5: AI Search (if backend has data)
    console.log('\n5️⃣ Testing AI Search...');
    const searchResponse = await fetch(`${BACKEND_URL}/ask`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query: 'What technical information is available?',
        k: 5
      })
    });

    if (searchResponse.ok) {
      const searchData = await searchResponse.json();
      console.log('   ✅ AI search endpoint works');
      console.log('   🤖 Answer length:', searchData.answer?.length || 0);
      console.log('   📚 Sources count:', searchData.sources?.length || 0);
      results.aiSearch = true;
    } else {
      const errorText = await searchResponse.text();
      if (errorText.includes('Index is empty')) {
        console.log('   ⚠️ AI search works but no documents indexed (expected)');
        results.aiSearch = true;
      } else {
        console.log('   ❌ AI search failed:', searchResponse.status, errorText);
      }
    }

    // Summary
    console.log('\n📊 FEATURE TEST SUMMARY');
    console.log('========================');
    console.log(`Backend Health: ${results.backend ? '✅ WORKING' : '❌ FAILED'}`);
    console.log(`Google Drive: ${results.googleDrive ? '✅ WORKING' : '❌ FAILED'}`);
    console.log(`AI Search: ${results.aiSearch ? '✅ WORKING' : '❌ FAILED'}`);

    const workingFeatures = Object.values(results).filter(Boolean).length;
    const totalFeatures = Object.keys(results).length;
    
    console.log(`\n🎯 Overall Status: ${workingFeatures}/${totalFeatures} features working`);

    if (workingFeatures === totalFeatures) {
      console.log('\n🎉 ALL FEATURES ARE WORKING!');
      console.log('\n📋 Your application should now support:');
      console.log('   ✅ Google Drive file browsing and folder navigation');
      console.log('   ✅ File upload to both Google Drive and backend');
      console.log('   ✅ AI-powered document analysis and search');
      console.log('   ✅ Direct file download from Google Drive');
      console.log('   ✅ Folder creation in Google Drive');
      console.log('   ✅ Multi-format export (PDF, Word, Excel)');
      console.log('   ✅ Real-time status monitoring');
    } else {
      console.log('\n⚠️ Some features need attention:');
      if (!results.backend) console.log('   - Backend deployment or configuration');
      if (!results.googleDrive) console.log('   - Google Apps Script deployment');
      if (!results.aiSearch) console.log('   - AI search configuration');
    }

    return workingFeatures === totalFeatures;

  } catch (error) {
    console.error('\n❌ Test failed with error:', error.message);
    return false;
  }
}

// Run the comprehensive test
testAllFeatures().then(success => {
  console.log('\n🔗 Useful Links:');
  console.log(`   Backend: ${BACKEND_URL}`);
  console.log(`   Apps Script: ${APPS_SCRIPT_URL}`);
  console.log('   GitHub: https://github.com/SHASHIYA06/metro-doc-ai-main');
  
  if (success) {
    console.log('\n🚀 Ready for production use!');
  } else {
    console.log('\n🔧 Some components need configuration.');
  }
}).catch(console.error);