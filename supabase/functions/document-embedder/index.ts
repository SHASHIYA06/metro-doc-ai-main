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

interface EmbedRequest {
  fileId: string;
  content: string;
  name: string;
  mimeType: string;
  size?: number;
  modifiedTime?: string;
}

async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const geminiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiKey) {
      throw new Error('GEMINI_API_KEY is required');
    }

    if (!text || text.trim() === '') {
      throw new Error('Text content cannot be empty');
    }

    const endpoint = 'https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent';
    const response = await fetch(`${endpoint}?key=${geminiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'models/text-embedding-004',
        content: {
          parts: [{ text: text.slice(0, 20000) }]
        }
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Gemini Embeddings API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    const values = data?.embedding?.values;
    if (!values || !Array.isArray(values)) {
      throw new Error('Invalid embedding response from Gemini');
    }
    
    return values as number[];
  } catch (error) {
    console.error('Document embedding generation error:', error);
    throw new Error(`Embedding generation failed: ${error.message}`);
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { fileId, content, name, mimeType, size, modifiedTime }: EmbedRequest = await req.json();

    console.log('Processing document for embedding:', { fileId, name, mimeType });

    // Generate embedding for the document content
    const embedding = await generateEmbedding(content);

    // Store document with embedding in the database
    const { data, error } = await supabase
      .from('documents')
      .upsert({
        file_id: fileId,
        name,
        content,
        mime_type: mimeType,
        size,
        modified_time: modifiedTime ? new Date(modifiedTime).toISOString() : null,
        embedding,
        metadata: {
          processed_at: new Date().toISOString(),
          content_length: content.length
        }
      });

    if (error) {
      console.error('Database error:', error);
      throw new Error(`Failed to store document: ${error.message}`);
    }

    console.log('Document embedded successfully:', fileId);

    return new Response(
      JSON.stringify({ 
        success: true, 
        fileId,
        message: 'Document embedded successfully',
        timestamp: new Date().toISOString(),
        details: {
          name,
          mimeType,
          contentLength: content.length
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Document embedding error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.stack || 'No stack trace available',
        timestamp: new Date().toISOString(),
        success: false,
        fileId: null
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});