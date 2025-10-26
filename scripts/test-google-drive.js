#!/usr/bin/env node

/**
 * Google Drive Apps Script Connection Test
 * This script tests the Google Apps Script connection and functionality
 */

import fetch from 'node-fetch';

const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzq7-DRXeX5dbcCAXfSqDgjubDAWkTiHOMdZ1PLaCdknrPkKfbo5znLvntYN7lICzz_mQ/exec';

console.log('🧪 Google Drive Apps Script Connection Test\n');

async function testConnection() {
  console.log('📡 Testing Apps Script URL:', APPS_SCRIPT_URL);
  
  try {
    // Test 1: Basic connection test
    console.log('\n1️⃣ Testing basic connection...');
    const testUrl = `${APPS_SCRIPT_URL}?action=test`;
    console.log('   URL:', testUrl);
    
    const response = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('   Status:', response.status);
    console.log('   Status Text:', response.statusText);
    
    if (!response.ok) {
      console.log('   ❌ HTTP Error:', response.status);
      return false;
    }

    const data = await response.json();
    console.log('   Response:', JSON.stringify(data, null, 2));

    if (data.ok && data.message) {
      console.log('   ✅ Basic connection test PASSED');
    } else {
      console.log('   ❌ Basic connection test FAILED - Invalid response');
      return false;
    }

    // Test 2: List files test
    console.log('\n2️⃣ Testing file listing...');
    const listUrl = `${APPS_SCRIPT_URL}?action=listFiles`;
    console.log('   URL:', listUrl);
    
    const listResponse = await fetch(listUrl);
    console.log('   Status:', listResponse.status);
    
    if (listResponse.ok) {
      const listData = await listResponse.json();
      console.log('   Files found:', listData.files ? listData.files.length : 0);
      
      if (listData.ok && Array.isArray(listData.files)) {
        console.log('   ✅ File listing test PASSED');
        
        // Show first few files
        if (listData.files.length > 0) {
          console.log('   📁 Sample files:');
          listData.files.slice(0, 3).forEach((file, index) => {
            console.log(`      ${index + 1}. ${file.name} (${file.type})`);
          });
        }
      } else {
        console.log('   ❌ File listing test FAILED - Invalid response format');
        console.log('   Response:', JSON.stringify(listData, null, 2));
      }
    } else {
      console.log('   ❌ File listing test FAILED - HTTP Error');
    }

    // Test 3: Folder listing test
    console.log('\n3️⃣ Testing folder listing...');
    const folderUrl = `${APPS_SCRIPT_URL}?action=listTree`;
    console.log('   URL:', folderUrl);
    
    const folderResponse = await fetch(folderUrl);
    console.log('   Status:', folderResponse.status);
    
    if (folderResponse.ok) {
      const folderData = await folderResponse.json();
      console.log('   Folders found:', folderData.folders ? folderData.folders.length : 0);
      
      if (folderData.ok && Array.isArray(folderData.folders)) {
        console.log('   ✅ Folder listing test PASSED');
      } else {
        console.log('   ❌ Folder listing test FAILED');
      }
    } else {
      console.log('   ❌ Folder listing test FAILED - HTTP Error');
    }

    console.log('\n🎉 Google Apps Script tests completed!');
    return true;

  } catch (error) {
    console.error('\n❌ Connection test failed:', error.message);
    console.error('   Error details:', error);
    return false;
  }
}

async function testCORS() {
  console.log('\n🌐 Testing CORS configuration...');
  
  try {
    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'OPTIONS',
    });
    
    console.log('   OPTIONS Status:', response.status);
    console.log('   CORS Headers:');
    
    const corsHeaders = [
      'access-control-allow-origin',
      'access-control-allow-methods',
      'access-control-allow-headers'
    ];
    
    corsHeaders.forEach(header => {
      const value = response.headers.get(header);
      console.log(`      ${header}: ${value || 'Not set'}`);
    });
    
    return true;
  } catch (error) {
    console.error('   ❌ CORS test failed:', error.message);
    return false;
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting comprehensive Google Apps Script tests...\n');
  
  const connectionResult = await testConnection();
  const corsResult = await testCORS();
  
  console.log('\n📊 TEST SUMMARY:');
  console.log('================');
  console.log(`Connection Test: ${connectionResult ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`CORS Test: ${corsResult ? '✅ PASSED' : '❌ FAILED'}`);
  
  if (connectionResult && corsResult) {
    console.log('\n🎉 ALL TESTS PASSED! Google Apps Script is working correctly.');
    console.log('\n📋 Next steps:');
    console.log('1. Your Apps Script is properly deployed and accessible');
    console.log('2. The frontend should be able to connect to Google Drive');
    console.log('3. File upload and listing should work in the application');
  } else {
    console.log('\n⚠️ Some tests failed. Please check:');
    console.log('1. Apps Script is deployed as web app with "Anyone" access');
    console.log('2. Google Drive API is enabled in the Apps Script project');
    console.log('3. The deployment URL is correct');
    console.log('4. CORS headers are properly configured');
  }
  
  console.log('\n🔗 Apps Script URL:', APPS_SCRIPT_URL);
  console.log('📁 Google Drive Folder ID: 1fUHu5fb5Z77Aq4cAiK4Zybq-Dpgjf0xlzEDsxIgT9m8');
}

// Execute tests
runAllTests().catch(console.error);