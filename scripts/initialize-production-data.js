#!/usr/bin/env node
/**
 * INITIALIZE PRODUCTION DATA
 * Load comprehensive technical documentation for immediate AI search
 */

const API_BASE_URL = process.env.VITE_API_BASE_URL || 'https://metro-doc-ai-main.onrender.com';

console.log('🚀 INITIALIZING PRODUCTION DATA');
console.log('================================\n');

async function initializeProductionData() {
  try {
    // Clear and load comprehensive data
    console.log('📚 Loading comprehensive technical documentation...');
    
    // Execute the comprehensive data loader
    const { execSync } = require('child_process');
    execSync('node scripts/load-comprehensive-data.js', { stdio: 'inherit' });
    
    console.log('\n✅ PRODUCTION DATA INITIALIZATION COMPLETE!');
    console.log('🎉 AI Search is ready with comprehensive technical documentation!');
    
  } catch (error) {
    console.error('\n❌ INITIALIZATION FAILED:', error.message);
  }
}

initializeProductionData();