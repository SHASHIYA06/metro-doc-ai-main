#!/usr/bin/env node

/**
 * Test the Google Apps Script endpoints that work in the HTML version
 */

import fetch from 'node-fetch';

const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzq7-DRXeX5dbcCAXfSqDgjubDAWkTiHOMdZ1PLaCdknrPkKfbo5znLvntYN7lICzz_mQ/exec';

console.log('🧪 Testing Working HTML Endpoints\n');

async function testWorkingEndpoints() {
  console.log('📡 Apps Script URL:', APPS_SCRIPT_URL);
  
  try {
    // Test 1: List Tree (this works in HTML)
    console.log('\n1️⃣ Testing listTree (works in HTML)...');
    const treeUrl = `${APPS_SCRIPT_URL}?action=listTree`;
    console.log('   URL:', treeUrl);
    
    const treeResponse = await fetch(treeUrl);
    console.log('   Status:', treeResponse.status);
    
    if (treeResponse.ok) {
      const treeData = await treeResponse.json();
      console.log('   Response keys:', Object.keys(treeData));
      console.log('   Has folders:', !!treeData.folders);
      console.log('   Folders count:', treeData.folders?.length || 0);
      
      if (treeData.folders && treeData.folders.length > 0) {
        console.log('   ✅ listTree WORKS - Found folders!');
        console.log('   Sample folder:', treeData.folders[0]);
      } else {
        console.log('   ⚠️ listTree works but no folders found');
      }
    } else {
      console.log('   ❌ listTree FAILED');
    }

    // Test 2: List Files (this works in HTML)
    console.log('\n2️⃣ Testing listFiles (works in HTML)...');
    const filesUrl = `${APPS_SCRIPT_URL}?action=listFiles`;
    console.log('   URL:', filesUrl);
    
    const filesResponse = await fetch(filesUrl);
    console.log('   Status:', filesResponse.status);
    
    if (filesResponse.ok) {
      const filesData = await filesResponse.json();
      console.log('   Response keys:', Object.keys(filesData));
      console.log('   Has files:', !!filesData.files);
      console.log('   Files count:', filesData.files?.length || 0);
      
      if (filesData.files && filesData.files.length > 0) {
        console.log('   ✅ listFiles WORKS - Found files!');
        console.log('   Sample file:', filesData.files[0]);
      } else {
        console.log('   ⚠️ listFiles works but no files found');
      }
    } else {
      console.log('   ❌ listFiles FAILED');
    }

    // Test 3: Test action (this might not work if script not updated)
    console.log('\n3️⃣ Testing test action (might not work)...');
    const testUrl = `${APPS_SCRIPT_URL}?action=test`;
    console.log('   URL:', testUrl);
    
    const testResponse = await fetch(testUrl);
    console.log('   Status:', testResponse.status);
    
    if (testResponse.ok) {
      const testData = await testResponse.json();
      console.log('   Response:', testData);
      
      if (testData.ok && testData.message) {
        console.log('   ✅ test action WORKS - Script is updated!');
      } else {
        console.log('   ❌ test action not working - Script needs update');
      }
    } else {
      console.log('   ❌ test action FAILED');
    }

    console.log('\n📊 SUMMARY:');
    console.log('===========');
    console.log('The HTML version works because it uses listTree and listFiles actions.');
    console.log('Your React app should work with the same endpoints.');
    console.log('The "test" action might not work if the script hasn\'t been updated.');
    
    return true;

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    return false;
  }
}

// Run the test
testWorkingEndpoints().catch(console.error);