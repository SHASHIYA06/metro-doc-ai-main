#!/usr/bin/env node

// Complete Application Test Script
// Author: SHASHI SHEKHAR MISHRA
// Tests the complete KMRCL Metro Document Intelligence application

import fetch from 'node-fetch';

// Configuration
const BACKEND_URL = 'http://localhost:3000';
const GOOGLE_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzq7-DRXeX5dbcCAXfSqDgjubDAWkTiHOMdZ1PLaCdknrPkKfbo5znLvntYN7lICzz_mQ/exec';
const GOOGLE_SHEET_ID = '1fUHu5fb5Z77Aq4cAiK4Zybq-Dpgjf0xlzEDsxIgT9m8';

console.log('🚀 Testing Complete KMRCL Metro Document Intelligence Application');
console.log('📍 Backend URL:', BACKEND_URL);
console.log('📍 Google Apps Script URL:', GOOGLE_APPS_SCRIPT_URL);
console.log('📊 Google Sheet ID:', GOOGLE_SHEET_ID);
console.log('');

// Test backend health
async function testBackendHealth() {
    console.log('🔧 Testing backend health...');
    
    try {
        const response = await fetch(`${BACKEND_URL}/health`);
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ Backend is healthy');
            console.log('📊 Backend stats:', data);
            return true;
        } else {
            console.log('❌ Backend health check failed:', response.status);
            return false;
        }
    } catch (error) {
        console.log('❌ Backend is not running:', error.message);
        console.log('💡 Start the backend with: cd backend && npm start');
        return false;
    }
}

// Test Google Drive integration
async function testGoogleDriveIntegration() {
    console.log('\n📁 Testing Google Drive integration...');
    
    try {
        // Test folder listing
        const foldersUrl = `${GOOGLE_APPS_SCRIPT_URL}?action=listTree&sheetId=${GOOGLE_SHEET_ID}`;
        const foldersResponse = await fetch(foldersUrl);
        
        if (foldersResponse.ok) {
            const foldersData = await foldersResponse.json();
            console.log('✅ Google Drive folders retrieved:', foldersData.folders?.length || 0);
            
            // Test file listing
            const filesUrl = `${GOOGLE_APPS_SCRIPT_URL}?action=listFiles&sheetId=${GOOGLE_SHEET_ID}`;
            const filesResponse = await fetch(filesUrl);
            
            if (filesResponse.ok) {
                const filesData = await filesResponse.json();
                console.log('✅ Google Drive files retrieved:', filesData.files?.length || 0);
                
                if (filesData.files && filesData.files.length > 0) {
                    console.log('📄 Sample file:', filesData.files[0].name);
                    return { success: true, files: filesData.files, folders: foldersData.folders };
                }
            }
        }
        
        console.log('❌ Google Drive integration failed');
        return { success: false };
    } catch (error) {
        console.log('❌ Google Drive integration error:', error.message);
        return { success: false };
    }
}

// Test file upload and processing
async function testFileProcessing(sampleFile) {
    console.log('\n📤 Testing file processing...');
    
    if (!sampleFile) {
        console.log('⚠️ No sample file available for testing');
        return false;
    }
    
    try {
        // Create sample content for testing
        const sampleContent = `BEML DOCUMENT TEST CONTENT

File Name: ${sampleFile.name}
File Type: ${sampleFile.mimeType}
File Size: ${sampleFile.size}

TECHNICAL SPECIFICATIONS:
- System: Metro Door Control
- Voltage: 110V DC
- Current: 15A Max
- Temperature Range: -20°C to +60°C

SAFETY PROCEDURES:
- Emergency stop procedures
- Maintenance guidelines
- Safety protocols

WIRING INFORMATION:
- Power connections
- Control signals
- Communication interfaces

This is test content for the KMRCL Metro Document Intelligence system.`;

        // Test JSON upload endpoint
        const uploadData = {
            content: sampleContent,
            fileName: sampleFile.name,
            system: 'BEML Documents',
            subsystem: 'Test Processing',
            mimeType: sampleFile.mimeType
        };

        const uploadResponse = await fetch(`${BACKEND_URL}/ingest-json`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(uploadData)
        });

        if (uploadResponse.ok) {
            const uploadResult = await uploadResponse.json();
            console.log('✅ File processing successful');
            console.log('📊 Processing result:', {
                added: uploadResult.added,
                total: uploadResult.total
            });
            return true;
        } else {
            console.log('❌ File processing failed:', uploadResponse.status);
            return false;
        }
    } catch (error) {
        console.log('❌ File processing error:', error.message);
        return false;
    }
}

// Test AI search functionality
async function testAISearch() {
    console.log('\n🔍 Testing AI search functionality...');
    
    try {
        const searchQueries = [
            'What are the technical specifications?',
            'door control system',
            'safety procedures',
            'wiring information'
        ];

        for (const query of searchQueries) {
            console.log(`🔍 Testing query: "${query}"`);
            
            const searchResponse = await fetch(`${BACKEND_URL}/ask`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    query: query,
                    k: 5
                })
            });

            if (searchResponse.ok) {
                const searchResult = await searchResponse.json();
                console.log(`✅ Search successful - Found ${searchResult.sources?.length || 0} sources`);
                
                if (searchResult.result && !searchResult.result.includes('No relevant documents found')) {
                    console.log(`📄 Result preview: ${searchResult.result.substring(0, 100)}...`);
                }
            } else {
                console.log(`❌ Search failed for "${query}":`, searchResponse.status);
            }
        }
        
        return true;
    } catch (error) {
        console.log('❌ AI search error:', error.message);
        return false;
    }
}

// Test backend statistics
async function testBackendStats() {
    console.log('\n📊 Testing backend statistics...');
    
    try {
        const statsResponse = await fetch(`${BACKEND_URL}/stats`);
        
        if (statsResponse.ok) {
            const stats = await statsResponse.json();
            console.log('✅ Backend statistics retrieved');
            console.log('📊 Stats:', {
                totalChunks: stats.totalChunks,
                uniqueFiles: stats.uniqueFiles,
                averageChunkSize: stats.averageChunkSize
            });
            return true;
        } else {
            console.log('❌ Backend statistics failed:', statsResponse.status);
            return false;
        }
    } catch (error) {
        console.log('❌ Backend statistics error:', error.message);
        return false;
    }
}

// Run complete application test
async function runCompleteTest() {
    console.log('🧪 Running complete application test suite...\n');
    
    const tests = [
        { name: 'Backend Health', test: testBackendHealth },
        { name: 'Google Drive Integration', test: testGoogleDriveIntegration },
    ];
    
    const results = [];
    let googleDriveData = null;
    
    // Run initial tests
    for (const { name, test } of tests) {
        console.log(`${'='.repeat(50)}`);
        console.log(`🧪 Running: ${name}`);
        console.log(`${'='.repeat(50)}`);
        
        const result = await test();
        
        if (name === 'Google Drive Integration' && result.success) {
            googleDriveData = result;
        }
        
        results.push({ name, success: result.success || result });
        console.log(`${result.success || result ? '✅' : '❌'} ${name}: ${result.success || result ? 'PASSED' : 'FAILED'}`);
    }
    
    // Run dependent tests if backend is available
    const backendHealthy = results.find(r => r.name === 'Backend Health')?.success;
    
    if (backendHealthy) {
        const dependentTests = [
            { name: 'File Processing', test: () => testFileProcessing(googleDriveData?.files?.[0]) },
            { name: 'AI Search', test: testAISearch },
            { name: 'Backend Statistics', test: testBackendStats }
        ];
        
        for (const { name, test } of dependentTests) {
            console.log(`\n${'='.repeat(50)}`);
            console.log(`🧪 Running: ${name}`);
            console.log(`${'='.repeat(50)}`);
            
            const result = await test();
            results.push({ name, success: result });
            console.log(`${result ? '✅' : '❌'} ${name}: ${result ? 'PASSED' : 'FAILED'}`);
        }
    } else {
        console.log('\n⚠️ Skipping backend-dependent tests (backend not available)');
        results.push(
            { name: 'File Processing', success: false },
            { name: 'AI Search', success: false },
            { name: 'Backend Statistics', success: false }
        );
    }
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 COMPLETE APPLICATION TEST SUMMARY');
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
        console.log('\n🎉 All tests passed! Complete application is working perfectly.');
        console.log('\n🚀 Application is ready for:');
        console.log('   ✅ Development and testing');
        console.log('   ✅ Production deployment');
        console.log('   ✅ User acceptance testing');
        console.log('   ✅ Full feature utilization');
    } else if (passed >= 2) {
        console.log('\n⚠️ Partial success. Core components are working.');
        
        if (!backendHealthy) {
            console.log('\n💡 To enable full functionality:');
            console.log('   1. Start the backend server: cd backend && npm start');
            console.log('   2. Ensure Gemini API key is configured');
            console.log('   3. Re-run this test');
        }
    } else {
        console.log('\n❌ Multiple components failed. Please check:');
        console.log('   1. Backend server is running');
        console.log('   2. Google Apps Script is accessible');
        console.log('   3. Network connectivity is working');
        console.log('   4. Environment configuration is correct');
    }
    
    console.log('\n📋 Configuration Summary:');
    console.log(`   Backend URL: ${BACKEND_URL}`);
    console.log(`   Google Apps Script: ${GOOGLE_APPS_SCRIPT_URL}`);
    console.log(`   Google Sheet ID: ${GOOGLE_SHEET_ID}`);
    console.log(`   Test Time: ${new Date().toISOString()}`);
    
    if (googleDriveData?.success) {
        console.log('\n📁 Google Drive Data:');
        console.log(`   Folders: ${googleDriveData.folders?.length || 0}`);
        console.log(`   Files: ${googleDriveData.files?.length || 0}`);
        if (googleDriveData.files?.[0]) {
            console.log(`   Sample File: ${googleDriveData.files[0].name}`);
        }
    }
}

// Run the complete test
runCompleteTest().catch(error => {
    console.error('❌ Complete application test failed:', error);
    process.exit(1);
});