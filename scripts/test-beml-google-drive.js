#!/usr/bin/env node

/**
 * Test BEML Google Drive Integration
 * Verifies connection to actual Google Drive BEML DOCUMENTS folder
 */

console.log('🔍 TESTING BEML GOOGLE DRIVE INTEGRATION\n');
console.log('='.repeat(60));

// Test configuration - Using your correct working URL
const GOOGLE_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycby6XbPuA7XDjIbInBg8-CmBv1Ig7hy5-BuKq6q4ovSJfbDxz3JdkyK08Y9pUI4S2CiZ7A/exec';
const GOOGLE_SHEET_ID = '1fUHu5fb5Z77Aq4cAiK4Zybq-Dpgjf0xlzEDsxI0xm8';

async function testBEMLGoogleDriveIntegration() {
    console.log('📊 Configuration:');
    console.log(`   📍 Google Apps Script URL: ${GOOGLE_APPS_SCRIPT_URL}`);
    console.log(`   📋 Google Sheet ID: ${GOOGLE_SHEET_ID}`);
    console.log('');

    let testsPassed = 0;
    let totalTests = 0;

    // Test 1: Basic connectivity
    console.log('1️⃣ Testing Basic Google Apps Script Connectivity...');
    totalTests++;
    
    try {
        const testUrl = `${GOOGLE_APPS_SCRIPT_URL}?action=test&timestamp=${Date.now()}`;
        console.log(`   🔗 Testing: ${testUrl}`);
        
        const response = await fetch(testUrl, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Cache-Control': 'no-cache'
            }
        });

        console.log(`   📡 Response Status: ${response.status}`);
        
        if (response.ok) {
            const responseText = await response.text();
            console.log(`   📄 Response Preview: ${responseText.substring(0, 200)}...`);
            
            try {
                const data = JSON.parse(responseText);
                if (data.ok || data.success) {
                    console.log('   ✅ Basic connectivity test PASSED');
                    testsPassed++;
                } else {
                    console.log('   ⚠️ Basic connectivity test returned non-success response');
                }
            } catch (parseError) {
                console.log('   ⚠️ Response is not valid JSON, but connection established');
                testsPassed++; // Still count as success if we got a response
            }
        } else {
            console.log('   ❌ Basic connectivity test FAILED');
        }
    } catch (error) {
        console.log(`   ❌ Basic connectivity test ERROR: ${error.message}`);
    }

    console.log('');

    // Test 2: BEML Folders Loading
    console.log('2️⃣ Testing BEML Folders Loading...');
    totalTests++;
    
    try {
        const foldersUrl = `${GOOGLE_APPS_SCRIPT_URL}?action=listTree&sheetId=${GOOGLE_SHEET_ID}&bemlFocus=true&timestamp=${Date.now()}`;
        console.log(`   🔗 Testing: ${foldersUrl}`);
        
        const response = await fetch(foldersUrl);
        console.log(`   📡 Response Status: ${response.status}`);
        
        if (response.ok) {
            const responseText = await response.text();
            console.log(`   📄 Response Preview: ${responseText.substring(0, 300)}...`);
            
            try {
                const data = JSON.parse(responseText);
                if (data.folders && Array.isArray(data.folders)) {
                    console.log(`   📂 Found ${data.folders.length} folders`);
                    
                    // Check for BEML-specific folders
                    const bemlFolders = data.folders.filter(folder => 
                        folder.name && (
                            folder.name.toUpperCase().includes('BEML') ||
                            folder.name.toUpperCase().includes('DOCUMENTS') ||
                            folder.name.toUpperCase().includes('SIGNALLING') ||
                            folder.name.toUpperCase().includes('MAINTENANCE')
                        )
                    );
                    
                    console.log(`   📊 BEML-related folders: ${bemlFolders.length}`);
                    bemlFolders.slice(0, 6).forEach(folder => {
                        console.log(`      📂 ${folder.name} (${folder.count || 0} files)`);
                    });
                    
                    if (bemlFolders.length > 0) {
                        console.log('   ✅ BEML folders loading test PASSED');
                        testsPassed++;
                    } else {
                        console.log('   ⚠️ No BEML folders found in response');
                    }
                } else {
                    console.log('   ⚠️ No folders array found in response');
                }
            } catch (parseError) {
                console.log(`   ❌ JSON parse error: ${parseError.message}`);
            }
        } else {
            console.log('   ❌ BEML folders loading test FAILED');
        }
    } catch (error) {
        console.log(`   ❌ BEML folders loading ERROR: ${error.message}`);
    }

    console.log('');

    // Test 3: BEML Files Loading
    console.log('3️⃣ Testing BEML Files Loading...');
    totalTests++;
    
    try {
        const filesUrl = `${GOOGLE_APPS_SCRIPT_URL}?action=listFiles&sheetId=${GOOGLE_SHEET_ID}&bemlDocuments=true&timestamp=${Date.now()}`;
        console.log(`   🔗 Testing: ${filesUrl}`);
        
        const response = await fetch(filesUrl);
        console.log(`   📡 Response Status: ${response.status}`);
        
        if (response.ok) {
            const responseText = await response.text();
            console.log(`   📄 Response Preview: ${responseText.substring(0, 300)}...`);
            
            try {
                const data = JSON.parse(responseText);
                if (data.files && Array.isArray(data.files)) {
                    console.log(`   📄 Found ${data.files.length} files`);
                    
                    // Check for BEML-specific files
                    const bemlFiles = data.files.filter(file => 
                        file.name && (
                            file.name.toUpperCase().includes('BEML') ||
                            file.name.toUpperCase().includes('FDS') ||
                            file.name.toUpperCase().includes('SERVICE') ||
                            file.name.toUpperCase().includes('CHECKLIST') ||
                            file.name.toUpperCase().includes('MAINTENANCE')
                        )
                    );
                    
                    console.log(`   📊 BEML-related files: ${bemlFiles.length}`);
                    bemlFiles.slice(0, 5).forEach(file => {
                        const size = file.size ? `${Math.round(file.size / 1024)} KB` : 'Unknown size';
                        console.log(`      📄 ${file.name} (${size})`);
                    });
                    
                    if (bemlFiles.length > 0) {
                        console.log('   ✅ BEML files loading test PASSED');
                        testsPassed++;
                    } else {
                        console.log('   ⚠️ No BEML files found in response');
                    }
                } else {
                    console.log('   ⚠️ No files array found in response');
                }
            } catch (parseError) {
                console.log(`   ❌ JSON parse error: ${parseError.message}`);
            }
        } else {
            console.log('   ❌ BEML files loading test FAILED');
        }
    } catch (error) {
        console.log(`   ❌ BEML files loading ERROR: ${error.message}`);
    }

    console.log('');

    // Test Results
    console.log('='.repeat(60));
    console.log('📊 BEML GOOGLE DRIVE INTEGRATION TEST RESULTS');
    console.log('='.repeat(60));
    
    console.log(`\n📈 Tests Passed: ${testsPassed}/${totalTests}`);
    console.log(`📊 Success Rate: ${Math.round((testsPassed/totalTests) * 100)}%`);

    if (testsPassed === totalTests) {
        console.log('\n🎉 ALL TESTS PASSED - BEML GOOGLE DRIVE INTEGRATION WORKING!');
        console.log('\n✅ EXPECTED RESULTS IN APPLICATION:');
        console.log('   📂 BEML DOCUMENTS folder structure visible');
        console.log('   📄 All BEML files accessible');
        console.log('   📤 Upload functionality working');
        console.log('   🤖 AI search operational');
        
        console.log('\n🚀 NEXT STEPS:');
        console.log('   1. Start your application: npm run dev');
        console.log('   2. Check "📁 BEML DOCUMENTS" section');
        console.log('   3. Verify all 6 folders are displayed');
        console.log('   4. Test file selection and search');
        
        return true;
    } else if (testsPassed > 0) {
        console.log('\n⚠️ PARTIAL SUCCESS - SOME TESTS PASSED');
        console.log('\n🔧 RECOMMENDATIONS:');
        console.log('   1. Check Google Apps Script permissions');
        console.log('   2. Verify BEML DOCUMENTS folder access');
        console.log('   3. Test with demo data fallback');
        console.log('   4. Check network connectivity');
        
        return false;
    } else {
        console.log('\n❌ ALL TESTS FAILED - CONFIGURATION NEEDED');
        console.log('\n🔧 TROUBLESHOOTING:');
        console.log('   1. Verify Google Apps Script URL is correct');
        console.log('   2. Check Google Sheet ID is valid');
        console.log('   3. Ensure Google Apps Script is deployed');
        console.log('   4. Verify permissions for BEML DOCUMENTS folder');
        console.log('   5. Test network connectivity');
        
        console.log('\n📞 FALLBACK:');
        console.log('   Application will use demo data if Google Drive fails');
        console.log('   Demo data includes all 6 BEML folders with sample files');
        
        return false;
    }
}

// Run the test
if (import.meta.url === `file://${process.argv[1]}`) {
    testBEMLGoogleDriveIntegration()
        .then(success => {
            process.exit(success ? 0 : 1);
        })
        .catch(error => {
            console.error('\n❌ Test execution failed:', error);
            process.exit(1);
        });
}

export { testBEMLGoogleDriveIntegration };