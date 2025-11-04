#!/usr/bin/env node

/**
 * TEST INTELLIGENT SEARCH
 * Test the new multi-strategy search approach
 */

const API_BASE_URL = process.env.VITE_API_BASE_URL || 'https://metro-doc-ai-main.onrender.com';

console.log('🧠 TESTING INTELLIGENT SEARCH');
console.log('==============================\n');

async function testIntelligentSearch() {
  try {
    // Test queries that might fail with simple search
    const testQueries = [
      'surge voltage',
      'what is the operating voltage',
      'describe the safety systems in detail',
      'electrical specifications and requirements',
      'train control system information',
      'voltage', // This should work
      'safety', // This should work
      'nonexistent term that will definitely fail'
    ];
    
    console.log('📊 Testing multiple search strategies for each query...\n');
    
    for (const query of testQueries) {
      console.log(`🔍 Testing: "${query}"`);
      console.log('─'.repeat(50));
      
      // Strategy 1: Original query k=5
      console.log('Strategy 1: Original query k=5');
      try {
        const response1 = await fetch(`${API_BASE_URL}/ask`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query, k: 5, system: '', subsystem: '', tags: [] })
        });
        const data1 = await response1.json();
        const success1 = data1.result && !data1.result.includes('No relevant documents found') && data1.sources?.length > 0;
        console.log(`  Result: ${success1 ? '✅ SUCCESS' : '❌ FAILED'} - ${data1.result?.length || 0} chars, ${data1.sources?.length || 0} sources`);
        
        if (success1) {
          console.log('  ✅ Strategy 1 worked - no need for fallbacks\n');
          continue;
        }
      } catch (e) {
        console.log(`  ❌ Strategy 1 error: ${e.message}`);
      }
      
      // Strategy 2: k=3
      console.log('Strategy 2: Same query k=3');
      try {
        const response2 = await fetch(`${API_BASE_URL}/ask`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query, k: 3, system: '', subsystem: '', tags: [] })
        });
        const data2 = await response2.json();
        const success2 = data2.result && !data2.result.includes('No relevant documents found') && data2.sources?.length > 0;
        console.log(`  Result: ${success2 ? '✅ SUCCESS' : '❌ FAILED'} - ${data2.result?.length || 0} chars, ${data2.sources?.length || 0} sources`);
        
        if (success2) {
          console.log('  ✅ Strategy 2 worked - k=3 was the solution\n');
          continue;
        }
      } catch (e) {
        console.log(`  ❌ Strategy 2 error: ${e.message}`);
      }
      
      // Strategy 3: Simplified query
      const keyWords = query.toLowerCase()
        .split(/\s+/)
        .filter(word => word.length > 2)
        .filter(word => !['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'its', 'may', 'new', 'now', 'old', 'see', 'two', 'who', 'boy', 'did', 'she', 'use', 'way', 'what', 'when', 'with'].includes(word));
      
      const simplifiedQuery = keyWords.slice(0, 2).join(' ') || keyWords[0] || query;
      console.log(`Strategy 3: Simplified query "${simplifiedQuery}"`);
      
      try {
        const response3 = await fetch(`${API_BASE_URL}/ask`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: simplifiedQuery, k: 5, system: '', subsystem: '', tags: [] })
        });
        const data3 = await response3.json();
        const success3 = data3.result && !data3.result.includes('No relevant documents found') && data3.sources?.length > 0;
        console.log(`  Result: ${success3 ? '✅ SUCCESS' : '❌ FAILED'} - ${data3.result?.length || 0} chars, ${data3.sources?.length || 0} sources`);
        
        if (success3) {
          console.log('  ✅ Strategy 3 worked - simplified query was the solution\n');
          continue;
        }
      } catch (e) {
        console.log(`  ❌ Strategy 3 error: ${e.message}`);
      }
      
      // Strategy 4: Single keyword
      if (keyWords.length > 0) {
        const singleWord = keyWords[0];
        console.log(`Strategy 4: Single keyword "${singleWord}"`);
        
        try {
          const response4 = await fetch(`${API_BASE_URL}/ask`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: singleWord, k: 5, system: '', subsystem: '', tags: [] })
          });
          const data4 = await response4.json();
          const success4 = data4.result && !data4.result.includes('No relevant documents found') && data4.sources?.length > 0;
          console.log(`  Result: ${success4 ? '✅ SUCCESS' : '❌ FAILED'} - ${data4.result?.length || 0} chars, ${data4.sources?.length || 0} sources`);
          
          if (success4) {
            console.log('  ✅ Strategy 4 worked - single keyword was the solution\n');
            continue;
          }
        } catch (e) {
          console.log(`  ❌ Strategy 4 error: ${e.message}`);
        }
      }
      
      console.log('  ❌ All strategies failed for this query\n');
    }
    
    console.log('🎯 INTELLIGENT SEARCH TEST COMPLETE');
    console.log('===================================');
    console.log('The frontend now uses all these strategies automatically!');
    console.log('Users will get better results even with complex queries.');
    
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
  }
}

testIntelligentSearch();