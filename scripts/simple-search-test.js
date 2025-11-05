#!/usr/bin/env node
/**
 * SIMPLE SEARCH TEST
 * Test search directly to see what's happening
 */

const API_BASE_URL = process.env.VITE_API_BASE_URL || 'https://metro-doc-ai-main.onrender.com';

console.log('🔍 SIMPLE SEARCH TEST');
console.log('=====================\n');

async function simpleSearchTest() {
  try {
    // Step 1: Check current stats
    console.log('📊 Step 1: Checking current backend stats...');
    const statsResponse = await fetch(`${API_BASE_URL}/stats`);
    const stats = await statsResponse.json();
    console.log('Current stats:', stats);
    console.log(`Average chunk size: ${stats.averageChunkSize} characters`);
    
    if (stats.averageChunkSize < 100) {
      console.log('⚠️ WARNING: Chunk size is very small - content might not be processed correctly');
    }

    // Step 2: Test search with detailed logging
    console.log('\n🔍 Step 2: Testing search...');
    
    const searchResponse = await fetch(`${API_BASE_URL}/ask`, {
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

    const searchResult = await searchResponse.json();
    
    console.log('Search response:');
    console.log(`- Result length: ${searchResult.result?.length || 0} chars`);
    console.log(`- Sources count: ${searchResult.sources?.length || 0}`);
    console.log(`- Used chunks: ${searchResult.used || 0}`);
    console.log(`- Total indexed: ${searchResult.totalIndexed || 0}`);
    console.log(`- Threshold: ${searchResult.threshold || 'unknown'}`);

    if (searchResult.sources && searchResult.sources.length > 0) {
      console.log('\n--- SOURCES ANALYSIS ---');
      searchResult.sources.forEach((source, index) => {
        console.log(`\nSource ${index + 1}:`);
        console.log(`  File: ${source.fileName}`);
        console.log(`  System: ${source.system}`);
        console.log(`  Score: ${source.score} (raw: ${source.rawScore}, boost: ${source.boost})`);
        console.log(`  Preview length: ${source.preview?.length || 0} chars`);
        console.log(`  Preview: "${source.preview?.substring(0, 200)}..."`);
        
        // Check if preview contains real content
        const hasRealContent = source.preview && (
          source.preview.includes('1.3 meters') || 
          source.preview.includes('110V DC') ||
          source.preview.includes('DCU power supply') ||
          source.preview.includes('Door width') ||
          source.preview.includes('DOOR SYSTEMS')
        );
        
        console.log(`  Contains real door content: ${hasRealContent ? '✅ YES' : '❌ NO'}`);
      });
    }

    // Step 3: Check the AI response
    console.log('\n--- AI RESPONSE ANALYSIS ---');
    if (searchResult.result) {
      const cleanResult = searchResult.result.replace(/<[^>]*>/g, '');
      console.log(`AI response length: ${cleanResult.length} chars`);
      
      const mentionsInvalidPDF = cleanResult.includes('Invalid PDF structure') || 
                                cleanResult.includes('error extracting content') ||
                                cleanResult.includes('unable to provide specific');
      
      const containsRealInfo = cleanResult.includes('1.3 meters') || 
                              cleanResult.includes('110V DC') ||
                              cleanResult.includes('DCU power supply');
      
      console.log(`Mentions invalid PDF: ${mentionsInvalidPDF ? '❌ YES' : '✅ NO'}`);
      console.log(`Contains real door info: ${containsRealInfo ? '✅ YES' : '❌ NO'}`);
      
      console.log(`\nAI Response preview:`);
      console.log(`"${cleanResult.substring(0, 300)}..."`);
    }

    // Step 4: Diagnosis
    console.log('\n🎯 DIAGNOSIS');
    console.log('=============');
    
    if (stats.totalChunks === 0) {
      console.log('❌ No content indexed - upload failed');
    } else if (stats.averageChunkSize < 100) {
      console.log('❌ Content indexed but chunks are too small');
      console.log('💡 Issue: Content processing is truncating the text');
    } else if (!searchResult.sources || searchResult.sources.length === 0) {
      console.log('❌ Content indexed but search not finding matches');
      console.log('💡 Issue: Search similarity threshold too high or embedding mismatch');
    } else {
      const hasRealContentInSources = searchResult.sources.some(source =>
        source.preview && (
          source.preview.includes('1.3 meters') || 
          source.preview.includes('110V DC')
        )
      );
      
      if (hasRealContentInSources) {
        console.log('✅ Real content found in search sources');
        console.log('💡 Issue: AI is ignoring the provided content in response generation');
      } else {
        console.log('❌ Real content not found in search sources');
        console.log('💡 Issue: Content not properly stored or retrieved');
      }
    }

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
  }
}

simpleSearchTest();