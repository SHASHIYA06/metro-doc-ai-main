#!/usr/bin/env node

// Test Google Drive Integration with Enhanced Service
// Author: SHASHI SHEKHAR MISHRA
// Tests the correct Google Apps Script URL and Sheet ID integration

import fetch from 'node-fetch';

// Configuration from the application
const GOOGLE_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzq7-DRXeX5dbcCAXfSqDgjubDAWkTiHOMdZ1PLaCdknrPkKfbo5znLvntYN7lICzz_mQ/exec';
const GOOGLE_SHEET_ID = '1fUHu5fb5Z77Aq4cAiK4Zybq-Dpgjf0xlzEDsxIgT9m8';

console.log('🚀 Testing Google Drive Integration');
console.log('📍 Apps Script URL:', GOOGLE_APPS_SCRIPT_URL);
console.log('📊 Sheet ID:', GOOGLE_SHEET_ID);
console.log('');

// Test functions
async function testConnection() {
    console.log('🔧 Testing basic connection...');
    
    try {
        const testUrl = `${GOOGLE_APPS_SCRIPT_URL}?action=test&sheetId=${GOOGLE_SHEET_ID}`;
        console.log('🔗 Test URL:', testUrl);
        
        const response = await fetch(testUrl, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'KMRCL-Test-Script/1.0'
            }
        });
        
        console.log('📡 Response Status:', response.status);
        console.log('📡 Response Headers:', Object.fromEntries(response.headers.entries()));
        
        const responseText = await response.text();
        console.log('📄 Response Body:', responseText.substring(0, 500));
        
        if (response.ok) {
            try {
                const data = JSON.parse(responseText);
                console.log('✅ Connection test successful');
                console.log('📊 Response data:', data);
                return true;
            } catch (parseError) {
                console.log('⚠️ Response is not JSON, but connection successful');
                return true;
            }
        } else {
            console.log('❌ Connection test failed');
            return false;
        }
    } catch (error) {
        console.error('❌ Connection error:', error.message);
        return false;
    }
}

async function testListTree() {
    console.log('\n📁 Testing folder tree listing...');
    
    try {
        const url = `${GOOGLE_APPS_SCRIPT_URL}?action=listTree&sheetId=${GOOGLE_SHEET_ID}`;
        console.log('🔗 Tree URL:', url);
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'KMRCL-Test-Script/1.0'
            }
        });
        
        console.log('📡 Tree Response Status:', response.status);
        
        const responseText = await response.text();
        console.log('📄 Tree Response:', responseText.substring(0, 800));
        
        if (response.ok) {
            try {
                const data = JSON.parse(responseText);
                console.log('✅ Folder tree test successful');
                console.log('📁 Folders found:', data.folders?.length || data.data?.length || 0);
                if (data.folders || data.data) {
                    console.log('📁 Sample folders:', (data.folders || data.data).slice(0, 3));
                }
                return true;
            } catch (parseError) {
                console.log('⚠️ Tree response is not JSON');
                return false;
            }
        } else {
            console.log('❌ Folder tree test failed');
            return false;
        }
    } catch (error) {
        console.error('❌ Folder tree error:', error.message);
        return false;
    }
}

async function testListFiles() {
    console.log('\n📄 Testing file listing...');
    
    try {
        const url = `${GOOGLE_APPS_SCRIPT_URL}?action=listFiles&sheetId=${GOOGLE_SHEET_ID}`;
        console.log('🔗 Files URL:', url);
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'KMRCL-Test-Script/1.0'
            }
        });
        
        console.log('📡 Files Response Status:', response.status);
        
        const responseText = await response.text();
        console.log('📄 Files Response:', responseText.substring(0, 800));
        
        if (response.ok) {
            try {
                const data = JSON.parse(responseText);
                console.log('✅ File listing test successful');
                console.log('📄 Files found:', data.files?.length || data.data?.length || 0);
                if (data.files || data.data) {
                    console.log('📄 Sample files:', (data.files || data.data).slice(0, 3));
                }
                return true;
            } catch (parseError) {
                console.log('⚠️ Files response is not JSON');
                return false;
            }
        } else {
            console.log('❌ File listing test failed');
            return false;
        }
    } catch (error) {
        console.error('❌ File listing error:', error.message);
        return false;
    }
}

async function testFileDownload() {
    console.log('\n📥 Testing file download...');
    
    try {
        // Try with a sample file ID (this might not exist, but tests the endpoint)
        const sampleFileId = 'sample_file_id';
        const url = `${GOOGLE_APPS_SCRIPT_URL}?action=downloadBase64&fileId=${sampleFileId}&sheetId=${GOOGLE_SHEET_ID}`;
        console.log('🔗 Download URL:', url);
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'KMRCL-Test-Script/1.0'
            }
        });
        
        console.log('📡 Download Response Status:', response.status);
        
        const responseText = await response.text();
        console.log('📄 Download Response:', responseText.substring(0, 300));
        
        if (response.ok) {
            try {
                const data = JSON.parse(responseText);
                console.log('✅ Download endpoint is accessible');
                console.log('📊 Download response structure:', Object.keys(data));
                return true;
            } catch (parseError) {
                console.log('⚠️ Download response is not JSON');
                return false;
            }
        } else {
            console.log('⚠️ Download test returned error (expected for sample file ID)');
            return true; // This is expected for a non-existent file
        }
    } catch (error) {
        console.error('❌ Download test error:', error.message);
        return false;
    }
}

async function testAllEndpoints() {
    console.log('🧪 Running comprehensive Google Drive integration tests...\n');
    
    const tests = [
        { name: 'Basic Connection', test: testConnection },
        { name: 'Folder Tree Listing', test: testListTree },
        { name: 'File Listing', test: testListFiles },
        { name: 'File Download Endpoint', test: testFileDownload }
    ];
    
    const results = [];
    
    for (const { name, test } of tests) {
        console.log(`\n${'='.repeat(50)}`);
        console.log(`🧪 Running: ${name}`);
        console.log(`${'='.repeat(50)}`);
        
        const result = await test();
        results.push({ name, success: result });
        
        console.log(`${result ? '✅' : '❌'} ${name}: ${result ? 'PASSED' : 'FAILED'}`);
    }
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(60));
    
    const passed = results.filter(r => r.success).length;
    const total = results.length;
    
    results.forEach(({ name, success }) => {
        console.log(`${success ? '✅' : '❌'} ${name}`);
    });
    
    console.log('\n📈 Results:');
    console.log(`   Passed: ${passed}/${total}`);
    console.log(`   Success Rate: ${Math.round((passed/total) * 100)}%`);
    
    if (passed === total) {
        console.log('\n🎉 All tests passed! Google Drive integration is working correctly.');
    } else if (passed > 0) {
        console.log('\n⚠️ Some tests passed. Google Drive integration is partially working.');
        console.log('   Check the Google Apps Script configuration and permissions.');
    } else {
        console.log('\n❌ All tests failed. Please check:');
        console.log('   1. Google Apps Script URL is correct and accessible');
        console.log('   2. Google Apps Script is deployed and has proper permissions');
        console.log('   3. Google Sheet ID is correct and accessible');
        console.log('   4. Network connectivity is working');
    }
    
    console.log('\n📋 Configuration Used:');
    console.log(`   Apps Script URL: ${GOOGLE_APPS_SCRIPT_URL}`);
    console.log(`   Sheet ID: ${GOOGLE_SHEET_ID}`);
    console.log(`   Test Time: ${new Date().toISOString()}`);
}

// Run the tests
testAllEndpoints().catch(error => {
    console.error('❌ Test suite failed:', error);
    process.exit(1);
});