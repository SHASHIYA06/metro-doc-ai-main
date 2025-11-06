#!/usr/bin/env node
/**
 * CLEAR AND FIX BACKEND
 * Clear old test data and ensure clean state for user uploads
 */

const API_BASE_URL = process.env.VITE_API_BASE_URL || 'https://metro-doc-ai-main.onrender.com';

console.log('🧹 CLEARING AND FIXING BACKEND');
console.log('===============================\n');

async function clearAndFixBackend() {
  try {
    // Step 1: Clear all existing data
    console.log('🧹 Step 1: Clearing ALL backend data...');
    try {
      const clearResponse = await fetch(`${API_BASE_URL}/clear`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (clearResponse.ok) {
        const clearResult = await clearResponse.json();
        console.log('✅ Backend cleared successfully:', clearResult);
      } else {
        console.log('⚠️ Clear request failed, but continuing...');
      }
    } catch (e) {
      console.log('⚠️ Clear endpoint error, but continuing...');
    }

    // Step 2: Verify backend is empty
    console.log('\n📊 Step 2: Verifying backend is empty...');
    const emptyStatsResponse = await fetch(`${API_BASE_URL}/stats`);
    const emptyStats = await emptyStatsResponse.json();
    console.log('Backend stats after clear:', emptyStats);
    
    if (emptyStats.totalChunks === 0) {
      console.log('✅ Backend is completely empty - ready for fresh uploads');
    } else {
      console.log('⚠️ Backend still has data - old documents may interfere');
      console.log('Files still present:', Object.keys(emptyStats.byFile || {}));
    }

    // Step 3: Test search on empty backend
    console.log('\n🔍 Step 3: Testing search on empty backend...');
    try {
      const emptySearchResponse = await fetch(`${API_BASE_URL}/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: 'door details',
          k: 5,
          system: '',
          subsystem: '',
          tags: []
        })
      });

      const emptySearchResult = await emptySearchResponse.json();
      console.log('Empty backend search result:', {
        hasResult: !!emptySearchResult.result,
        resultLength: emptySearchResult.result?.length || 0,
        sourcesCount: emptySearchResult.sources?.length || 0,
        message: emptySearchResult.result?.substring(0, 100) || 'No result'
      });

      if (emptySearchResult.sources && emptySearchResult.sources.length > 0) {
        console.log('⚠️ WARNING: Empty backend still returning sources!');
        console.log('Sources:', emptySearchResult.sources.map(s => s.fileName));
      } else {
        console.log('✅ Empty backend correctly returns no sources');
      }
    } catch (e) {
      console.log('Search on empty backend failed:', e.message);
    }

    console.log('\n🎯 BACKEND STATUS');
    console.log('=================');
    
    if (emptyStats.totalChunks === 0) {
      console.log('✅ Backend is clean and ready');
      console.log('💡 Now when you upload files via the frontend:');
      console.log('   1. They will be the ONLY files in the system');
      console.log('   2. All searches will use YOUR uploaded content');
      console.log('   3. No more interference from old test documents');
      console.log('\n📋 NEXT STEPS:');
      console.log('1. Go to your frontend application');
      console.log('2. Upload your files via Google Drive tab');
      console.log('3. Search will now use ONLY your uploaded files');
    } else {
      console.log('⚠️ Backend still has old data');
      console.log('💡 Old documents may still interfere with searches');
      console.log('💡 Consider restarting the backend service if possible');
    }

  } catch (error) {
    console.error('\n❌ CLEAR AND FIX FAILED:', error.message);
  }
}

clearAndFixBackend();