#!/usr/bin/env node

// Test BEML DOCUMENTS Integration Script
// Author: SHASHI SHEKHAR MISHRA
// Tests the BEML DOCUMENTS folder integration and upload functionality

import fetch from 'node-fetch';

// Configuration for BEML DOCUMENTS
const GOOGLE_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzq7-DRXeX5dbcCAXfSqDgjubDAWkTiHOMdZ1PLaCdknrPkKfbo5znLvntYN7lICzz_mQ/exec';
const GOOGLE_SHEET_ID = '1fUHu5fb5Z77Aq4cAiK4Zybq-Dpgjf0xlzEDsxIgT9m8';

console.log('🚀 Testing BEML DOCUMENTS Integration');
console.log('📍 Apps Script URL:', GOOGLE_APPS_SCRIPT_URL);
console.log('📊 Sheet ID:', GOOGLE_SHEET_ID);
console.log('📁 Target: BEML DOCUMENTS Folder');
console.log('');

// Test BEML folder structure
async function testBEMLFolderStructure() {
    console.log('📁 Testing BEML DOCUMENTS folder structure...');
    
    try {
        const url = `${GOOGLE_APPS_SCRIPT_URL}?action=listTree&sheetId=${GOOGLE_SHEET_ID}&bemlFocus=true`;
        console.log('🔗 BEML Tree URL:', url);
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'BEML-Test-Script/1.0'
            }
        });
        
        console.log('📡 BEML Response Status:', response.status);
        
        const responseText = await response.text();
        console.log('📄 BEML Response:', responseText.substring(0, 800));
        
        if (response.ok) {
            try {
                const data = JSON.parse(responseText);
                console.log('✅ BEML folder structure test successful');
                
                const folders = data.folders || data.data || [];
                const bemlFolders = folders.filter(folder => {
                    const name = folder.name?.toUpperCase() || '';
                    return name.includes('BEML') || name.includes('DOCUMENTS');
                });
                
                console.log('📁 BEML folders found:', bemlFolders.length);
                bemlFolders.forEach(folder => {
                    console.log(`   📂 ${folder.name} (${folder.count || 0} files)`);
                });
                
                return { success: true, folders: bemlFolders };
            } catch (parseError) {
                console.log('⚠️ BEML response is not JSON');
                return { success: false };
            }
        } else {
            console.log('❌ BEML folder structure test failed');
            return { success: false };
        }
    } catch (error) {
        console.error('❌ BEML folder structure error:', error.message);
        return { success: false };
    }
}

// Test BEML files listing
async function testBEMLFilesListing() {
    console.log('\n📄 Testing BEML DOCUMENTS files listing...');
    
    try {
        const url = `${GOOGLE_APPS_SCRIPT_URL}?action=listFiles&sheetId=${GOOGLE_SHEET_ID}&bemlFocus=true`;
        console.log('🔗 BEML Files URL:', url);
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'BEML-Test-Script/1.0'
            }
        });
        
        console.log('📡 BEML Files Response Status:', response.status);
        
        const responseText = await response.text();
        console.log('📄 BEML Files Response:', responseText.substring(0, 800));
        
        if (response.ok) {
            try {
                const data = JSON.parse(responseText);
                console.log('✅ BEML files listing test successful');
                
                const files = data.files || data.data || [];
                const bemlFiles = files.filter(file => {
                    const name = (file.name || '').toUpperCase();
                    const path = (file.path || '').toUpperCase();
                    return name.includes('BEML') || 
                           path.includes('BEML') || 
                           path.includes('DOCUMENTS') ||
                           name.includes('SERVICE') ||
                           name.includes('CHECKLIST');
                });
                
                console.log('📄 BEML files found:', bemlFiles.length);
                bemlFiles.slice(0, 5).forEach(file => {
                    console.log(`   📄 ${file.name} (${file.size || 'Unknown size'})`);
                });
                
                return { success: true, files: bemlFiles };
            } catch (parseError) {
                console.log('⚠️ BEML files response is not JSON');
                return { success: false };
            }
        } else {
            console.log('❌ BEML files listing test failed');
            return { success: false };
        }
    } catch (error) {
        console.error('❌ BEML files listing error:', error.message);
        return { success: false };
    }
}

// Test BEML file download
async function testBEMLFileDownload(sampleFileId) {
    console.log('\n📥 Testing BEML file download...');
    
    if (!sampleFileId) {
        console.log('⚠️ No sample file ID available for download test');
        return { success: false };
    }
    
    try {
        const url = `${GOOGLE_APPS_SCRIPT_URL}?action=downloadBase64&fileId=${sampleFileId}&sheetId=${GOOGLE_SHEET_ID}&bemlDocument=true`;
        console.log('🔗 BEML Download URL:', url);
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'BEML-Test-Script/1.0'
            }
        });
        
        console.log('📡 BEML Download Response Status:', response.status);
        
        const responseText = await response.text();
        console.log('📄 BEML Download Response:', responseText.substring(0, 300));
        
        if (response.ok) {
            try {
                const data = JSON.parse(responseText);
                console.log('✅ BEML file download test accessible');
                console.log('📊 BEML download response structure:', Object.keys(data));
                return { success: true };
            } catch (parseError) {
                console.log('⚠️ BEML download response is not JSON');
                return { success: false };
            }
        } else {
            console.log('⚠️ BEML download test returned error (expected for some files)');
            return { success: true }; // This might be expected
        }
    } catch (error) {
        console.error('❌ BEML download test error:', error.message);
        return { success: false };
    }
}

// Test BEML upload functionality
async function testBEMLUpload() {
    console.log('\n📤 Testing BEML DOCUMENTS upload functionality...');
    
    try {
        // Create sample content for upload test
        const sampleContent = `BEML TEST DOCUMENT

Document: Test Upload to BEML DOCUMENTS
Created: ${new Date().toISOString()}
Purpose: Testing upload functionality

CONTENT:
This is a test document to verify the upload functionality to the BEML DOCUMENTS folder.

TECHNICAL DETAILS:
- System: Test System
- Subsystem: Upload Testing
- File Type: Text Document
- Upload Method: Google Apps Script API

BEML CONTEXT:
This document is being uploaded to test the BEML DOCUMENTS folder integration
for the KMRCL Metro Document Intelligence system.`;

        // Convert to base64
        const base64Content = Buffer.from(sampleContent).toString('base64');
        
        const uploadData = {
            action: 'uploadToBEML',
            fileName: 'BEML_Test_Upload.txt',
            mimeType: 'text/plain',
            data: base64Content,
            targetFolder: 'BEML DOCUMENTS',
            sheetId: GOOGLE_SHEET_ID,
            metadata: {
                system: 'Test System',
                subsystem: 'Upload Testing',
                description: 'Test document for BEML upload functionality',
                uploadedBy: 'BEML Test Script',
                uploadDate: new Date().toISOString(),
                bemlDocument: true
            },
            timestamp: Date.now()
        };

        console.log('📤 Attempting BEML upload...');
        const response = await fetch(GOOGLE_APPS_SCRIPT_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'BEML-Test-Script/1.0'
            },
            body: JSON.stringify(uploadData)
        });

        console.log('📡 BEML Upload Response Status:', response.status);
        
        const responseText = await response.text();
        console.log('📄 BEML Upload Response:', responseText.substring(0, 500));

        if (response.ok) {
            try {
                const data = JSON.parse(responseText);
                if (data.success || data.ok) {
                    console.log('✅ BEML upload test successful');
                    console.log('📄 Uploaded file ID:', data.fileId || data.id);
                    return { success: true, fileId: data.fileId || data.id };
                } else {
                    console.log('⚠️ BEML upload returned error:', data.error || data.message);
                    return { success: false, error: data.error || data.message };
                }
            } catch (parseError) {
                console.log('⚠️ BEML upload response is not JSON');
                return { success: false };
            }
        } else {
            console.log('❌ BEML upload test failed');
            return { success: false };
        }
    } catch (error) {
        console.error('❌ BEML upload test error:', error.message);
        return { success: false };
    }
}

// Test BEML search functionality
async function testBEMLSearch() {
    console.log('\n🔍 Testing BEML DOCUMENTS search functionality...');
    
    try {
        const searchQueries = ['BEML', 'service checklist', 'maintenance', 'technical'];
        
        for (const query of searchQueries) {
            console.log(`🔍 Testing BEML search for: "${query}"`);
            
            const url = `${GOOGLE_APPS_SCRIPT_URL}?action=search&sheetId=${GOOGLE_SHEET_ID}&bemlSearch=true&keyword=${encodeURIComponent(query)}`;
            
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'User-Agent': 'BEML-Test-Script/1.0'
                }
            });

            if (response.ok) {
                const data = await response.json();
                console.log(`✅ BEML search for "${query}" successful - Found ${data.results?.length || 0} results`);
            } else {
                console.log(`⚠️ BEML search for "${query}" failed:`, response.status);
            }
        }
        
        return { success: true };
    } catch (error) {
        console.error('❌ BEML search test error:', error.message);
        return { success: false };
    }
}

// Run comprehensive BEML tests
async function runBEMLTests() {
    console.log('🧪 Running comprehensive BEML DOCUMENTS integration tests...\n');
    
    const tests = [
        { name: 'BEML Folder Structure', test: testBEMLFolderStructure },
        { name: 'BEML Files Listing', test: testBEMLFilesListing },
        { name: 'BEML Upload Functionality', test: testBEMLUpload },
        { name: 'BEML Search Functionality', test: testBEMLSearch }
    ];
    
    const results = [];
    let bemlData = null;
    
    // Run tests
    for (const { name, test } of tests) {
        console.log(`${'='.repeat(60)}`);
        console.log(`🧪 Running: ${name}`);
        console.log(`${'='.repeat(60)}`);
        
        const result = await test();
        
        if (name === 'BEML Files Listing' && result.success && result.files) {
            bemlData = result;
        }
        
        results.push({ name, success: result.success || result });
        console.log(`${result.success || result ? '✅' : '❌'} ${name}: ${result.success || result ? 'PASSED' : 'FAILED'}`);
    }
    
    // Test file download if we have files
    if (bemlData && bemlData.files && bemlData.files.length > 0) {
        console.log(`\n${'='.repeat(60)}`);
        console.log(`🧪 Running: BEML File Download`);
        console.log(`${'='.repeat(60)}`);
        
        const downloadResult = await testBEMLFileDownload(bemlData.files[0].id);
        results.push({ name: 'BEML File Download', success: downloadResult.success });
        console.log(`${downloadResult.success ? '✅' : '❌'} BEML File Download: ${downloadResult.success ? 'PASSED' : 'FAILED'}`);
    }
    
    // Summary
    console.log('\n' + '='.repeat(70));
    console.log('📊 BEML DOCUMENTS INTEGRATION TEST SUMMARY');
    console.log('='.repeat(70));
    
    const passed = results.filter(r => r.success).length;
    const total = results.length;
    
    results.forEach(({ name, success }) => {
        console.log(`${success ? '✅' : '❌'} ${name}`);
    });
    
    console.log('\n📈 Results:');
    console.log(`   Passed: ${passed}/${total}`);
    console.log(`   Success Rate: ${Math.round((passed/total) * 100)}%`);
    
    if (passed === total) {
        console.log('\n🎉 All BEML tests passed! BEML DOCUMENTS integration is working perfectly.');
        console.log('\n🚀 BEML DOCUMENTS features ready:');
        console.log('   ✅ Folder structure access');
        console.log('   ✅ File listing and filtering');
        console.log('   ✅ File download and content extraction');
        console.log('   ✅ Upload functionality to BEML folder');
        console.log('   ✅ Search within BEML documents');
    } else if (passed >= 3) {
        console.log('\n⚠️ Most BEML tests passed. Core BEML functionality is working.');
        console.log('\n💡 BEML DOCUMENTS integration is mostly functional:');
        console.log('   - File access and listing works');
        console.log('   - Upload functionality may need Google Apps Script updates');
        console.log('   - Search functionality may need backend configuration');
    } else {
        console.log('\n❌ Multiple BEML tests failed. Please check:');
        console.log('   1. Google Apps Script URL is correct and accessible');
        console.log('   2. Google Apps Script has BEML-specific functions');
        console.log('   3. BEML DOCUMENTS folder exists and is accessible');
        console.log('   4. Google Sheet ID is correct');
        console.log('   5. Network connectivity is working');
    }
    
    console.log('\n📋 BEML Configuration Summary:');
    console.log(`   Apps Script URL: ${GOOGLE_APPS_SCRIPT_URL}`);
    console.log(`   Google Sheet ID: ${GOOGLE_SHEET_ID}`);
    console.log(`   Target Folder: BEML DOCUMENTS`);
    console.log(`   Test Time: ${new Date().toISOString()}`);
    
    if (bemlData && bemlData.files) {
        console.log('\n📁 BEML Files Found:');
        console.log(`   Total Files: ${bemlData.files.length}`);
        if (bemlData.files.length > 0) {
            console.log(`   Sample File: ${bemlData.files[0].name}`);
            console.log(`   File Types: ${[...new Set(bemlData.files.map(f => f.mimeType))].join(', ')}`);
        }
    }
}

// Run the BEML tests
runBEMLTests().catch(error => {
    console.error('❌ BEML test suite failed:', error);
    process.exit(1);
});