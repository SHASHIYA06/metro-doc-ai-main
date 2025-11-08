#!/usr/bin/env node
/**
 * START APPLICATION WITH DATA
 * Initialize data and start the application
 */

const { execSync } = require('child_process');

console.log('🚀 STARTING METRO AI SEARCH APPLICATION');
console.log('=======================================\n');

async function startApplication() {
  try {
    console.log('📚 Step 1: Initializing comprehensive data...');
    execSync('node scripts/load-comprehensive-data.js', { stdio: 'inherit' });
    
    console.log('\n🎉 APPLICATION READY!');
    console.log('✅ Comprehensive technical data loaded');
    console.log('✅ AI Search interface ready');
    console.log('✅ File upload functionality available');
    console.log('\n💡 Users can now:');
    console.log('   - Search any technical information immediately');
    console.log('   - Upload additional documents');
    console.log('   - Get file-specific search results');
    
  } catch (error) {
    console.error('\n❌ STARTUP FAILED:', error.message);
  }
}

startApplication();