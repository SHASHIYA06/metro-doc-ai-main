#!/usr/bin/env node

/**
 * Test BEML Integration Fix
 * Verifies that BEML DOCUMENTS data is properly loaded and displayed
 */

import { googleDriveBEMLService } from '../src/services/googleDriveBEML.js';

async function testBEMLIntegration() {
    console.log('🧪 Testing BEML Integration Fix...\n');

    try {
        // Test 1: Initialize BEML service
        console.log('1️⃣ Testing BEML Service Initialization...');
        await googleDriveBEMLService.initialize();
        console.log('✅ BEML service initialized successfully\n');

        // Test 2: Test connection
        console.log('2️⃣ Testing BEML Connection...');
        const isConnected = await googleDriveBEMLService.testConnection();
        console.log(`📡 Connection status: ${isConnected ? '✅ Connected' : '⚠️ Demo mode'}\n`);

        // Test 3: Load folder tree
        console.log('3️⃣ Loading BEML Folder Structure...');
        const folders = await googleDriveBEMLService.loadTree();
        console.log(`📁 Found ${folders.length} BEML folders:`);
        folders.forEach(folder => {
            console.log(`   📂 ${folder.name} (${folder.count} items) - ID: ${folder.id}`);
        });
        console.log('');

        // Test 4: Load files from root
        console.log('4️⃣ Loading Files from BEML Root...');
        const rootFiles = await googleDriveBEMLService.listFiles('');
        console.log(`📄 Found ${rootFiles.length} files in BEML root:`);
        rootFiles.slice(0, 5).forEach(file => {
            console.log(`   📄 ${file.name} (${file.type}) - ${file.mimeType}`);
        });
        if (rootFiles.length > 5) {
            console.log(`   ... and ${rootFiles.length - 5} more files`);
        }
        console.log('');

        // Test 5: Load files from specific folders
        if (folders.length > 0) {
            console.log('5️⃣ Loading Files from Specific Folders...');
            for (const folder of folders.slice(0, 3)) {
                try {
                    const folderFiles = await googleDriveBEMLService.listFiles(folder.id);
                    console.log(`📂 ${folder.name}: ${folderFiles.length} files`);
                    folderFiles.slice(0, 3).forEach(file => {
                        console.log(`   📄 ${file.name} (${file.type})`);
                    });
                } catch (error) {
                    console.log(`⚠️ Could not load files from ${folder.name}: ${error.message}`);
                }
            }
            console.log('');
        }

        // Test 6: Test demo data fallback
        console.log('6️⃣ Testing Demo Data Fallback...');
        const demoFiles = await googleDriveBEMLService.getBEMLDemoFiles();
        console.log(`📊 Demo data contains ${demoFiles.length} items:`);
        demoFiles.slice(0, 5).forEach(file => {
            console.log(`   ${file.type === 'folder' ? '📂' : '📄'} ${file.name}`);
        });
        console.log('');

        // Test 7: Verify data structure
        console.log('7️⃣ Verifying Data Structure...');
        const allFiles = [...folders.map(f => ({...f, type: 'folder'})), ...rootFiles];
        console.log(`📊 Total BEML items: ${allFiles.length}`);
        console.log(`   📂 Folders: ${folders.length}`);
        console.log(`   📄 Files: ${rootFiles.length}`);
        
        // Check for required properties
        const validItems = allFiles.filter(item => 
            item.id && item.name && item.type
        );
        console.log(`✅ Valid items: ${validItems.length}/${allFiles.length}`);
        console.log('');

        // Summary
        console.log('📋 BEML Integration Test Summary:');
        console.log(`   🔗 Connection: ${isConnected ? 'Live' : 'Demo mode'}`);
        console.log(`   📂 Folders loaded: ${folders.length}`);
        console.log(`   📄 Files loaded: ${rootFiles.length}`);
        console.log(`   📊 Demo fallback: ${demoFiles.length} items available`);
        console.log(`   ✅ Data structure: ${validItems.length > 0 ? 'Valid' : 'Invalid'}`);

        if (validItems.length > 0) {
            console.log('\n🎉 BEML Integration Test PASSED!');
            console.log('   Your application should now display BEML DOCUMENTS data correctly.');
            return true;
        } else {
            console.log('\n❌ BEML Integration Test FAILED!');
            console.log('   No valid data structure found.');
            return false;
        }

    } catch (error) {
        console.error('❌ BEML Integration Test Failed:', error);
        console.log('\n🔧 Troubleshooting:');
        console.log('   1. Check Google Apps Script URL configuration');
        console.log('   2. Verify BEML DOCUMENTS folder access');
        console.log('   3. Ensure service account permissions');
        console.log('   4. Check network connectivity');
        return false;
    }
}

// Run the test
if (import.meta.url === `file://${process.argv[1]}`) {
    testBEMLIntegration()
        .then(success => {
            process.exit(success ? 0 : 1);
        })
        .catch(error => {
            console.error('Test execution failed:', error);
            process.exit(1);
        });
}

export { testBEMLIntegration };