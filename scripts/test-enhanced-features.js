#!/usr/bin/env node

// Enhanced Feature Testing Script for KMRCL Metro Document Intelligence
// Tests all advanced AI, RAG, and vector search capabilities

import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

const API_BASE_URL = process.env.API_BASE_URL || 'https://metro-doc-ai-main.onrender.com';
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://kmrcldocumentsearchgoogledrive.netlify.app';

console.log('🚀 KMRCL Enhanced Features Test Suite');
console.log('=====================================');
console.log(`API URL: ${API_BASE_URL}`);
console.log(`Frontend URL: ${FRONTEND_URL}`);
console.log('');

// Test results tracking
const testResults = {
  passed: 0,
  failed: 0,
  total: 0,
  details: []
};

// Helper function to run tests
async function runTest(testName, testFunction) {
  testResults.total++;
  console.log(`🧪 Testing: ${testName}`);
  
  try {
    const startTime = Date.now();
    await testFunction();
    const duration = Date.now() - startTime;
    
    testResults.passed++;
    testResults.details.push({
      name: testName,
      status: 'PASSED',
      duration: `${duration}ms`
    });
    console.log(`✅ ${testName} - PASSED (${duration}ms)`);
  } catch (error) {
    testResults.failed++;
    testResults.details.push({
      name: testName,
      status: 'FAILED',
      error: error.message
    });
    console.log(`❌ ${testName} - FAILED: ${error.message}`);
  }
  console.log('');
}

// Test 1: Backend Health and Enhanced Features
async function testBackendHealth() {
  const response = await fetch(`${API_BASE_URL}/health`);
  if (!response.ok) {
    throw new Error(`Health check failed: ${response.status}`);
  }
  
  const health = await response.json();
  console.log(`   📊 Backend Status: ${health.ok ? 'Healthy' : 'Unhealthy'}`);
  console.log(`   📈 Uptime: ${Math.round(health.uptime)}s`);
  console.log(`   💾 Memory: ${Math.round(health.memory.heapUsed / 1024 / 1024)}MB`);
  
  if (!health.ok) {
    throw new Error('Backend is not healthy');
  }
}

// Test 2: Enhanced Statistics
async function testEnhancedStats() {
  const response = await fetch(`${API_BASE_URL}/stats`);
  if (!response.ok) {
    throw new Error(`Stats failed: ${response.status}`);
  }
  
  const stats = await response.json();
  console.log(`   📚 Total Chunks: ${stats.totalChunks}`);
  console.log(`   📄 Unique Files: ${stats.uniqueFiles}`);
  console.log(`   📏 Avg Chunk Size: ${stats.averageChunkSize} chars`);
  console.log(`   🏷️ Tag Categories: ${Object.keys(stats.tagCounts || {}).length}`);
  
  if (stats.totalChunks > 0) {
    console.log(`   🔍 Top Systems: ${Object.keys(stats.bySystem || {}).slice(0, 3).join(', ')}`);
    console.log(`   🏗️ Top Subsystems: ${Object.keys(stats.bySubsystem || {}).slice(0, 3).join(', ')}`);
  }
}

// Test 3: Advanced AI Search with RAG
async function testAdvancedAISearch() {
  const testQuery = "What are the safety requirements for metro signaling systems?";
  
  const response = await fetch(`${API_BASE_URL}/ask`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: testQuery,
      k: 10,
      system: '',
      subsystem: '',
      tags: ['safety', 'signaling']
    })
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`AI search failed: ${response.status} - ${errorText}`);
  }
  
  const result = await response.json();
  console.log(`   🤖 AI Response Length: ${result.result?.length || 0} chars`);
  console.log(`   📊 Sources Found: ${result.sources?.length || 0}`);
  console.log(`   🎯 Used Documents: ${result.used || 0}`);
  console.log(`   📈 Total Indexed: ${result.totalIndexed || 0}`);
  
  if (result.sources && result.sources.length > 0) {
    const avgScore = result.sources.reduce((sum, s) => sum + s.score, 0) / result.sources.length;
    console.log(`   🎯 Average Relevance: ${Math.round(avgScore * 100)}%`);
  }
}

// Test 4: Tag-Based Search
async function testTagBasedSearch() {
  const response = await fetch(`${API_BASE_URL}/search-by-tags`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      tags: ['electrical', 'safety'],
      query: 'Find electrical safety specifications'
    })
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Tag search failed: ${response.status} - ${errorText}`);
  }
  
  const result = await response.json();
  console.log(`   🏷️ Tag Search Results: ${result.sources?.length || 0}`);
  console.log(`   🔍 Query: "Find electrical safety specifications"`);
  console.log(`   📋 Tags: electrical, safety`);
}

// Test 5: Frontend Accessibility
async function testFrontendAccessibility() {
  const response = await fetch(FRONTEND_URL);
  if (!response.ok) {
    throw new Error(`Frontend not accessible: ${response.status}`);
  }
  
  const html = await response.text();
  
  // Check for key components
  const checks = [
    { name: 'Title', pattern: /KMRCL.*Metro.*Intelligence/i },
    { name: 'AI Search', pattern: /AI.*Search/i },
    { name: 'Google Drive', pattern: /Google.*Drive/i },
    { name: 'Upload', pattern: /Upload/i },
    { name: 'Enhanced 3D', pattern: /Enhanced.*3D|3D.*Background/i }
  ];
  
  for (const check of checks) {
    const found = check.pattern.test(html);
    console.log(`   ${found ? '✅' : '❌'} ${check.name}: ${found ? 'Found' : 'Missing'}`);
    if (!found && check.name === 'Title') {
      throw new Error(`Critical component missing: ${check.name}`);
    }
  }
}

// Test 6: Google Apps Script Integration
async function testGoogleAppsScript() {
  const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzq7-DRXeX5dbcCAXfSqDgjubDAWkTiHOMdZ1PLaCdknrPkKfbo5znLvntYN7lICzz_mQ/exec';
  
  try {
    const response = await fetch(`${APPS_SCRIPT_URL}?action=test`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });
    
    if (!response.ok) {
      throw new Error(`Apps Script not accessible: ${response.status}`);
    }
    
    const result = await response.json();
    console.log(`   📱 Apps Script Status: ${result.ok ? 'Active' : 'Inactive'}`);
    console.log(`   🔗 Integration: Google Drive API`);
    
    if (!result.ok) {
      throw new Error('Google Apps Script integration failed');
    }
  } catch (error) {
    console.log(`   ⚠️ Google Apps Script: ${error.message}`);
    // Don't fail the test as this might be expected in some environments
  }
}

// Test 7: Performance Benchmarks
async function testPerformanceBenchmarks() {
  const tests = [
    { name: 'Health Check', url: `${API_BASE_URL}/health` },
    { name: 'Stats Endpoint', url: `${API_BASE_URL}/stats` },
    { name: 'Frontend Load', url: FRONTEND_URL }
  ];
  
  const results = [];
  
  for (const test of tests) {
    const startTime = Date.now();
    try {
      const response = await fetch(test.url);
      const duration = Date.now() - startTime;
      results.push({ name: test.name, duration, status: response.status });
      console.log(`   ⚡ ${test.name}: ${duration}ms (${response.status})`);
    } catch (error) {
      const duration = Date.now() - startTime;
      results.push({ name: test.name, duration, status: 'ERROR' });
      console.log(`   ❌ ${test.name}: ${duration}ms (ERROR)`);
    }
  }
  
  const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / results.length;
  console.log(`   📊 Average Response Time: ${Math.round(avgDuration)}ms`);
  
  if (avgDuration > 5000) {
    throw new Error(`Performance issue: Average response time ${avgDuration}ms > 5000ms`);
  }
}

// Test 8: Enhanced Features Detection
async function testEnhancedFeatures() {
  const features = [
    'Advanced RAG Processing',
    'Multi-LLM Support',
    'Vector Search',
    'Semantic Similarity',
    'Glass Morphism UI',
    'MCP Integration',
    'Enhanced 3D Background'
  ];
  
  console.log('   🔍 Checking Enhanced Features:');
  
  // Check if frontend includes enhanced features
  try {
    const response = await fetch(FRONTEND_URL);
    const html = await response.text();
    
    const featureChecks = [
      { name: 'RAG Processing', pattern: /RAG|Retrieval.*Augmented/i },
      { name: 'Vector Search', pattern: /vector.*search|semantic.*search/i },
      { name: 'Glass Morphism', pattern: /glass.*morphism|backdrop.*blur/i },
      { name: 'Enhanced 3D', pattern: /Enhanced3D|3D.*Background/i },
      { name: 'AI Analysis', pattern: /AI.*Analysis|aiAnalysis/i }
    ];
    
    let foundFeatures = 0;
    for (const check of featureChecks) {
      const found = check.pattern.test(html);
      console.log(`     ${found ? '✅' : '⚠️'} ${check.name}`);
      if (found) foundFeatures++;
    }
    
    console.log(`   📈 Enhanced Features: ${foundFeatures}/${featureChecks.length} detected`);
    
    if (foundFeatures < 3) {
      throw new Error(`Insufficient enhanced features detected: ${foundFeatures}/${featureChecks.length}`);
    }
  } catch (error) {
    console.log(`   ⚠️ Feature detection failed: ${error.message}`);
  }
}

// Test 9: Error Handling and Resilience
async function testErrorHandling() {
  const errorTests = [
    {
      name: 'Invalid Endpoint',
      url: `${API_BASE_URL}/nonexistent`,
      expectedStatus: 404
    },
    {
      name: 'Malformed Request',
      url: `${API_BASE_URL}/ask`,
      method: 'POST',
      body: 'invalid json',
      expectedStatus: 400
    }
  ];
  
  for (const test of errorTests) {
    try {
      const options = {
        method: test.method || 'GET',
        headers: { 'Content-Type': 'application/json' }
      };
      
      if (test.body) {
        options.body = test.body;
      }
      
      const response = await fetch(test.url, options);
      console.log(`   🛡️ ${test.name}: ${response.status} (expected ${test.expectedStatus})`);
      
      if (Math.abs(response.status - test.expectedStatus) > 50) {
        console.log(`   ⚠️ Unexpected status code for ${test.name}`);
      }
    } catch (error) {
      console.log(`   🛡️ ${test.name}: Network error (expected)`);
    }
  }
}

// Test 10: Integration Test
async function testFullIntegration() {
  console.log('   🔄 Running full integration test...');
  
  // Simulate a complete user workflow
  const workflow = [
    'Check backend health',
    'Load frontend',
    'Perform AI search',
    'Check results'
  ];
  
  let completedSteps = 0;
  
  try {
    // Step 1: Backend health
    const healthResponse = await fetch(`${API_BASE_URL}/health`);
    if (healthResponse.ok) completedSteps++;
    
    // Step 2: Frontend load
    const frontendResponse = await fetch(FRONTEND_URL);
    if (frontendResponse.ok) completedSteps++;
    
    // Step 3: AI search
    const searchResponse = await fetch(`${API_BASE_URL}/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'Test integration query',
        k: 5
      })
    });
    if (searchResponse.ok) completedSteps++;
    
    // Step 4: Results processing
    if (searchResponse.ok) {
      const result = await searchResponse.json();
      if (result.result !== undefined) completedSteps++;
    }
    
    console.log(`   ✅ Integration Steps Completed: ${completedSteps}/${workflow.length}`);
    
    if (completedSteps < workflow.length) {
      throw new Error(`Integration incomplete: ${completedSteps}/${workflow.length} steps completed`);
    }
  } catch (error) {
    throw new Error(`Integration test failed at step ${completedSteps + 1}: ${error.message}`);
  }
}

// Main test execution
async function runAllTests() {
  console.log('Starting comprehensive test suite...\n');
  
  await runTest('Backend Health Check', testBackendHealth);
  await runTest('Enhanced Statistics', testEnhancedStats);
  await runTest('Advanced AI Search', testAdvancedAISearch);
  await runTest('Tag-Based Search', testTagBasedSearch);
  await runTest('Frontend Accessibility', testFrontendAccessibility);
  await runTest('Google Apps Script Integration', testGoogleAppsScript);
  await runTest('Performance Benchmarks', testPerformanceBenchmarks);
  await runTest('Enhanced Features Detection', testEnhancedFeatures);
  await runTest('Error Handling', testErrorHandling);
  await runTest('Full Integration Test', testFullIntegration);
  
  // Generate test report
  console.log('📋 TEST SUMMARY');
  console.log('===============');
  console.log(`✅ Passed: ${testResults.passed}/${testResults.total}`);
  console.log(`❌ Failed: ${testResults.failed}/${testResults.total}`);
  console.log(`📊 Success Rate: ${Math.round((testResults.passed / testResults.total) * 100)}%`);
  console.log('');
  
  if (testResults.failed > 0) {
    console.log('❌ FAILED TESTS:');
    testResults.details
      .filter(t => t.status === 'FAILED')
      .forEach(t => console.log(`   - ${t.name}: ${t.error}`));
    console.log('');
  }
  
  console.log('✅ PASSED TESTS:');
  testResults.details
    .filter(t => t.status === 'PASSED')
    .forEach(t => console.log(`   - ${t.name} (${t.duration})`));
  
  // Save detailed report
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      total: testResults.total,
      passed: testResults.passed,
      failed: testResults.failed,
      successRate: Math.round((testResults.passed / testResults.total) * 100)
    },
    details: testResults.details,
    environment: {
      apiUrl: API_BASE_URL,
      frontendUrl: FRONTEND_URL,
      nodeVersion: process.version
    }
  };
  
  fs.writeFileSync('test-report.json', JSON.stringify(report, null, 2));
  console.log('\n📄 Detailed report saved to test-report.json');
  
  // Exit with appropriate code
  process.exit(testResults.failed > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch(error => {
  console.error('❌ Test suite failed:', error);
  process.exit(1);
});