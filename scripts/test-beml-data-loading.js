#!/usr/bin/env node

// Test BEML Data Loading Script
// Author: SHASHI SHEKHAR MISHRA
// Tests if BEML DOCUMENTS data is properly loading in the application

import fetch from 'node-fetch';

// Configuration for BEML DOCUMENTS
const GOOGLE_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzq7-DRXeX5dbcCAXfSqDgjubDAWkTiHOMdZ1PLaCdknrPkKfbo5znLvntYN7lICzz_mQ/exec';
const GOOGLE_SHEET_ID = '1fUHu5fb5Z77Aq4cAiK4Zybq-Dpgjf0xlzEDsxIgT9m8';

console.log('🔍 Testing BEML DOCUMENTS Data Loading');
console.log('📍 Apps Script URL:', GOOGLE_APPS_SCRIPT_URL);
console.log('📊 Sheet ID:', GOOGLE_SHEET_ID);
console.log('');

// Test BEML folder loading exactly as the application does
async function testBEMLFolderLoading() {
    console.log('📁 Testing BEML folder loading (as application does)...');
    
    try {
        const url = `${GOOGLE_APPS_SCRIPT_URL}?action=listTree&sheetId=${GOOGLE_SHEET_ID}&timestamp=${Date.now()}`;
        console.log('🔗 Request URL:', url);
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Cache-Control': 'no-cache',
                'User-Agent': 'BEML-Documents-App/2.2.0'
            }
        });
        
        console.log('📡 Response Status:', response.status);
        console.log('📡 Response Headers:', Object.fromEntries(response.headers.entries()));
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const responseText = await response.text();
        console.log('📄 Raw Response Length:', responseText.length);
        console.log('📄 Raw Response Preview:', responseText.substring(0, 800));
        
        let data;
        try {
            data = JSON.parse(responseText);
        } catch (parseError) {
            console.error('❌ JSON Parse Error:', parseError);
            console.log('📄 Full Response:', responseText);
            return { success: false, error: 'JSON Parse Error' };
        }
        
        if (data.ok || data.success) {
            const allFolders = data.folders || data.data || [];
            console.log('✅ Total folders received:', allFolders.length);
            
            // Filter for BEML folders (as application does)
            const bemlFolders = allFolders.filter(folder => {
                const name = (folder.name || '').toUpperCase();
                return name.includes('BEML') || name.includes('DOCUMENTS');
            });
            
            console.log('📁 BEML folders found:', bemlFolders.length);
            console.log('📁 BEML folder details:');
            bemlFolders.forEach((folder, index) => {
                console.log(`   ${index + 1}. ${folder.name} (ID: ${folder.id}, Count: ${folder.count || 0})`);
            });
            
            return { 
                success: true, 
                totalFolders: allFolders.length,
                bemlFolders: bemlFolders.length,
                folders: bemlFolders
            };
        } else {
            console.error('❌ API Error:', data.error || data.message);
            return { success: false, error: data.error || data.message };
        }
    } catch (error) {
        console.error('❌ Request Error:', error.message);
        return { success: false, error: error.message };
    }
}

// Test BEML file loading exactly as the application does
async function testBEMLFileLoading() {
    console.log('\n📄 Testing BEML file loading (as application does)...');
    
    try {
        const url = `${GOOGLE_APPS_SCRIPT_URL}?action=listFiles&sheetId=${GOOGLE_SHEET_ID}&timestamp=${Date.now()}`;
        console.log('🔗 Request URL:', url);
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Cache-Control': 'no-cache',
                'User-Agent': 'BEML-Documents-App/2.2.0'
            }
        });
        
        console.log('📡 Response Status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const responseText = await response.text();
        console.log('📄 Raw Response Length:', responseText.length);
        console.log('📄 Raw Response Preview:', responseText.substring(0, 800));
        
        let data;
        try {
            data = JSON.parse(responseText);
        } catch (parseError) {
            console.error('❌ JSON Parse Error:', parseError);
            return { success: false, error: 'JSON Parse Error' };
        }
        
        if (data.ok || data.success) {
            const files = data.files || data.data || [];
            console.log('✅ Total files received:', files.length);
            
            console.log('📄 Sample files:');
            files.slice(0, 5).forEach((file, index) => {
                console.log(`   ${index + 1}. ${file.name} (${file.mimeType}, ${file.size || 'Unknown size'})`);
            });
            
            // Check file types
            const fileTypes = {};
            files.forEach(file => {
                const type = file.mimeType || 'unknown';
                fileTypes[type] = (fileTypes[type] || 0) + 1;
            });
            
            console.log('📊 File types breakdown:');
            Object.entries(fileTypes).forEach(([type, count]) => {
                console.log(`   ${type}: ${count} files`);
            });
            
            return { 
                success: true, 
                totalFiles: files.length,
                files: files.slice(0, 10), // Return first 10 for analysis
                fileTypes
            };
        } else {
            console.error('❌ API Error:', data.error || data.message);
            return { success: false, error: data.error || data.message };
        }
    } catch (error) {
        console.error('❌ Request Error:', error.message);
        return { success: false, error: error.message };
    }
}

// Test application initialization flow
async function testApplicationFlow() {
    console.log('\n🔄 Testing complete application initialization flow...');
    
    const folderResult = await testBEMLFolderLoading();
    const fileResult = await testBEMLFileLoading();
    
    console.log('\n📊 APPLICATION FLOW TEST RESULTS:');
    console.log('='.repeat(50));
    
    if (folderResult.success) {
        console.log('✅ Folder Loading: SUCCESS');
        console.log(`   - Total folders: ${folderResult.totalFolders}`);
        console.log(`   - BEML folders: ${folderResult.bemlFolders}`);
    } else {
        console.log('❌ Folder Loading: FAILED');
        console.log(`   - Error: ${folderResult.error}`);
    }
    
    if (fileResult.success) {
        console.log('✅ File Loading: SUCCESS');
        console.log(`   - Total files: ${fileResult.totalFiles}`);
        console.log(`   - File types: ${Object.keys(fileResult.fileTypes).length}`);
    } else {
        console.log('❌ File Loading: FAILED');
        console.log(`   - Error: ${fileResult.error}`);
    }
    
    // Determine what the application should show
    console.log('\n🎯 WHAT APPLICATION SHOULD DISPLAY:');
    console.log('='.repeat(50));
    
    if (folderResult.success && folderResult.bemlFolders > 0) {
        console.log('📁 FOLDERS TO DISPLAY:');
        folderResult.folders.forEach((folder, index) => {
            console.log(`   ${index + 1}. ${folder.name} (${folder.count || 0} files)`);
        });
    }
    
    if (fileResult.success && fileResult.totalFiles > 0) {
        console.log('📄 FILES TO DISPLAY:');
        fileResult.files.slice(0, 5).forEach((file, index) => {
            console.log(`   ${index + 1}. ${file.name}`);
        });
        if (fileResult.totalFiles > 5) {
            console.log(`   ... and ${fileResult.totalFiles - 5} more files`);
        }
    }
    
    // Provide troubleshooting guidance
    console.log('\n🔧 TROUBLESHOOTING GUIDANCE:');
    console.log('='.repeat(50));
    
    if (!folderResult.success || !fileResult.success) {
        console.log('❌ Issues detected:');
        if (!folderResult.success) {
            console.log(`   - Folder loading failed: ${folderResult.error}`);
        }
        if (!fileResult.success) {
            console.log(`   - File loading failed: ${fileResult.error}`);
        }
        console.log('\n💡 Possible solutions:');
        console.log('   1. Check Google Apps Script URL and permissions');
        console.log('   2. Verify Google Sheet ID is correct');
        console.log('   3. Ensure Google Apps Script is deployed and accessible');
        console.log('   4. Check network connectivity');
    } else if (folderResult.bemlFolders === 0 && fileResult.totalFiles === 0) {
        console.log('⚠️ No BEML data found:');
        console.log('   - Google Apps Script is working but no BEML data returned');
        console.log('   - Check if BEML DOCUMENTS folder exists in Google Drive');
        console.log('   - Verify Google Apps Script is reading from correct folder');
    } else {
        console.log('✅ Everything looks good!');
        console.log('   - BEML data is available and should display in application');
        console.log('   - If application still shows demo data, check browser console for errors');
    }
    
    return {
        folderSuccess: folderResult.success,
        fileSuccess: fileResult.success,
        bemlFolders: folderResult.bemlFolders || 0,
        totalFiles: fileResult.totalFiles || 0
    };
}

// Run the complete test
testApplicationFlow().then(result => {
    console.log('\n🏁 TEST COMPLETE');
    console.log('='.repeat(50));
    console.log(`Folder Loading: ${result.folderSuccess ? 'SUCCESS' : 'FAILED'}`);
    console.log(`File Loading: ${result.fileSuccess ? 'SUCCESS' : 'FAILED'}`);
    console.log(`BEML Folders: ${result.bemlFolders}`);
    console.log(`Total Files: ${result.totalFiles}`);
    
    if (result.folderSuccess && result.fileSuccess && (result.bemlFolders > 0 || result.totalFiles > 0)) {
        console.log('\n🎉 BEML DOCUMENTS data is available and should display in your application!');
    } else {
        console.log('\n⚠️ Issues detected - application may fall back to demo data');
    }
}).catch(error => {
    console.error('❌ Test suite failed:', error);
    process.exit(1);
});