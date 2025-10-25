import "https://deno.land/x/xhr@0.1.0/mod.ts";
// @ts-ignore
import { createClient } from 'npm:@supabase/supabase-js';

// Deno types
declare global {
  interface Window {
    Deno: any;
  }
}

const Deno = window.Deno;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

interface SearchRequest {
  query: string;
  matchThreshold?: number;
  matchCount?: number;
}

async function generateQueryEmbedding(query: string): Promise<number[]> {
  try {
    const geminiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiKey) {
      throw new Error('GEMINI_API_KEY is required');
    }

    if (!query || query.trim() === '') {
      throw new Error('Query cannot be empty');
    }

    const endpoint = 'https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent';
    const response = await fetch(`${endpoint}?key=${geminiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'models/text-embedding-004',
        content: {
          parts: [{ text: query.slice(0, 8000) }]
        }
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Gemini Embeddings API error: ${error}`);
    }

    const data = await response.json();
    const values = data?.embedding?.values;
    if (!values || !Array.isArray(values)) {
      throw new Error('Invalid embedding response from Gemini');
    }
    return values as number[];
  } catch (error) {
    console.error('Embedding generation error:', error);
    throw new Error(`Embedding generation failed: ${error.message}`);
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, matchThreshold = 0.78, matchCount = 10 }: SearchRequest = await req.json();

    console.log('Vector search request:', { query, matchThreshold, matchCount });

    // Generate embedding for the search query
    const queryEmbedding = await generateQueryEmbedding(query);

    // Search for similar documents using vector similarity
    const { data, error } = await supabase.rpc('search_documents_by_embedding', {
      query_embedding: queryEmbedding,
      match_threshold: matchThreshold,
      match_count: matchCount
    });

    if (error) {
      console.error('Vector search error:', error);
      throw new Error(`Search failed: ${error.message}`);
    }

    // Also perform traditional text search as fallback
    const { data: textResults, error: textError } = await supabase
      .from('documents')
      .select('id, file_id, name, content, mime_type')
      .or(`name.ilike.%${query}%, content.ilike.%${query}%`)
      .limit(5);

    if (textError) {
      console.warn('Text search failed:', textError);
    }

    // Combine and deduplicate results
    const vectorIds = new Set(data?.map((doc: any) => doc.id) || []);
    const combinedResults = [
      ...(data || []),
      ...(textResults?.filter(doc => !vectorIds.has(doc.id)).map(doc => ({
        ...doc,
        similarity: 0.5 // Default similarity for text matches
      })) || [])
    ];

    console.log(`Found ${combinedResults.length} documents matching query`);

    return new Response(
      JSON.stringify({ 
        results: combinedResults,
        query,
        total: combinedResults.length,
        success: true,
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Vector search error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.stack || 'No stack trace available',
        timestamp: new Date().toISOString(),
        success: false,
        results: [],
        total: 0
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});